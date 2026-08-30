import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  HARD_SPEND_CAP_MICRO,
  LIVE_WORKLOADS,
  quoteRequest,
  validateQuoteResults,
} from "../scripts/live-release-gate.mjs";

test("release gate has fixed, bounded provider canaries", () => {
  assert.equal(LIVE_WORKLOADS.length, 6);
  assert.deepEqual(
    LIVE_WORKLOADS.filter(({ modality }) => modality !== "text").map(
      ({ model, modality }) => [model, modality],
    ),
    [],
  );
  assert.equal(HARD_SPEND_CAP_MICRO, 30_000);
  assert.deepEqual(quoteRequest(LIVE_WORKLOADS[0]), {
    model: "Smollm-135m",
    modality: "text",
    prompt_tokens: 2_048,
    max_tokens: 8,
  });
});

test("quoted bounds match every child live test", async () => {
  const sources = await Promise.all(
    [
      "dify-aipg/tests/test_live_e2e.py",
      "ai-sdk-aipg/tests/live.e2e.test.ts",
      "elizaos-aipg/tests/runtime.live.e2e.test.ts",
      "langchain-aipg/tests/test_live_e2e.py",
    ].map((path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")),
  );
  const [dify, aiSdk, eliza, langchain] = sources;
  assert.match(dify, /AIPG_E2E_SMALL_MODEL/);
  assert.match(dify, /"max_tokens": 8/);
  assert.match(aiSdk, /AIPG_E2E_SMALL_MODEL/);
  assert.match(aiSdk, /maxOutputTokens: 8/);
  assert.match(eliza, /AIPG_E2E_ELIZA_MODEL/);
  assert.match(eliza, /maxTokens: 256/);
  assert.match(langchain, /AIPG_E2E_TOOL_MODEL/);
  assert.match(langchain, /max_tokens=256/);
});

test("quote validation accepts priced charging work within the hard cap", () => {
  const results = LIVE_WORKLOADS.map(({ id }, index) => ({
    id,
    payload: {
      charging_enabled: true,
      estimate: {
        priced: true,
        balance_sufficient: true,
        cost_micro: 10,
      },
    },
  }));
  assert.equal(validateQuoteResults(results, HARD_SPEND_CAP_MICRO), 60);
});

test("quote validation fails closed on rollout, price, credit, and cap errors", () => {
  const valid = {
    id: "canary",
    payload: {
      charging_enabled: true,
      estimate: { priced: true, balance_sufficient: true, cost_micro: 1 },
    },
  };
  assert.throws(
    () =>
      validateQuoteResults(
        [{ ...valid, payload: { ...valid.payload, charging_enabled: false } }],
        10,
      ),
    /charging rollout/,
  );
  assert.throws(
    () =>
      validateQuoteResults(
        [
          {
            ...valid,
            payload: {
              ...valid.payload,
              estimate: { ...valid.payload.estimate, priced: false },
            },
          },
        ],
        10,
      ),
    /not priced/,
  );
  assert.throws(
    () =>
      validateQuoteResults(
        [
          {
            ...valid,
            payload: {
              ...valid.payload,
              estimate: {
                ...valid.payload.estimate,
                balance_sufficient: false,
              },
            },
          },
        ],
        10,
      ),
    /sufficient credit/,
  );
  assert.throws(
    () =>
      validateQuoteResults(
        [
          {
            ...valid,
            payload: {
              ...valid.payload,
              estimate: { ...valid.payload.estimate, cost_micro: 11 },
            },
          },
        ],
        10,
      ),
    /approved spend cap/,
  );
});
