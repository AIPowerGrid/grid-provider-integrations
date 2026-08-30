import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import {
  generateWeeklyProof,
  renderWeeklyProof,
} from "../src/weekly-proof.mjs";

const fixture = {
  network: {
    schema: "aipg.network.status.v1",
    generated_at: "2026-08-29T05:44:17.407Z",
    capacity: {
      workers_online: 8,
      models_online: 11,
      redundancy_target: 3,
      models_below_target: Array.from(
        { length: 11 },
        (_, index) => `model-${index}`,
      ),
    },
    validators: {
      participating: 5,
      verified_independent: 0,
      assignments_completed: 573,
      agreement_rate: 0.9532710280373832,
      economic_effect: "none",
    },
    charging: { mode: "allowlist", global: false },
    incident_history_available: false,
  },
  totals: {
    day: { text: { jobs: 2763 }, image: { jobs: 2 } },
    total: {
      text: { jobs: 59555 },
      "3d": { jobs: 23 },
      video: { jobs: 106 },
      image: { jobs: 766 },
      audio: { jobs: 179 },
    },
  },
  payouts: {
    totals: { aipg_paid: 63882.7109, payouts: 1265, workers_paid: 8 },
  },
  distribution: {
    packages: [
      {
        label: "Vercel AI SDK",
        name: "@aipowergrid/ai-sdk-provider",
        version: "0.1.0",
        npmUrl: "https://www.npmjs.com/package/@aipowergrid/ai-sdk-provider",
        provenance: true,
      },
      {
        label: "ElizaOS",
        name: "@aipowergrid/plugin-aipg",
        version: "0.1.0",
        npmUrl: "https://www.npmjs.com/package/@aipowergrid/plugin-aipg",
        provenance: true,
      },
      {
        label: "n8n",
        name: "@aipowergrid/n8n-nodes-aipg",
        version: "0.1.3",
        npmUrl: "https://www.npmjs.com/package/@aipowergrid/n8n-nodes-aipg",
        provenance: true,
      },
    ],
    pullRequests: [
      {
        label: "LiteLLM",
        repository: "BerriAI/litellm",
        number: 38725,
        url: "https://github.com/BerriAI/litellm/pull/38725",
        state: "open",
        mergedAt: null,
      },
      {
        label: "Dify marketplace",
        repository: "langgenius/dify-plugins",
        number: 2986,
        url: "https://github.com/langgenius/dify-plugins/pull/2986",
        state: "open",
        mergedAt: null,
      },
      {
        label: "Vercel AI SDK",
        repository: "vercel/ai",
        number: 20003,
        url: "https://github.com/vercel/ai/pull/20003",
        state: "open",
        mergedAt: null,
      },
      {
        label: "ElizaOS registry",
        repository: "elizaOS/eliza",
        number: 29964,
        url: "https://github.com/elizaOS/eliza/pull/29964",
        state: "open",
        mergedAt: null,
      },
      {
        label: "LangChain docs",
        repository: "langchain-ai/docs",
        number: 5770,
        url: "https://github.com/langchain-ai/docs/pull/5770",
        state: "open",
        mergedAt: null,
      },
    ],
  },
};

test("weekly proof derives arithmetic and preserves trust boundaries", () => {
  const markdown = renderWeeklyProof(fixture);

  assert.match(markdown, /60,629 jobs recorded all time/);
  assert.match(markdown, /2,765 in the current 24h window/);
  assert.match(markdown, /63,882\.7109 AIPG across 1,265 on-chain Base/);
  assert.match(markdown, /95\.3% agreement/);
  assert.match(markdown, /0 independently verified operators/);
  assert.match(
    markdown,
    /Run a worker or validator: https:\/\/aipowergrid\.io\/run/,
  );
  assert.match(markdown, /does not prove paid-request count/);
  assert.match(
    markdown,
    /independent worker ownership, external builders, or historical uptime/,
  );
  assert.match(
    markdown,
    /not an uptime\s+promise, a paid-demand claim, proof of operator independence/,
  );
  assert.match(
    markdown,
    /Vercel AI SDK, ElizaOS, n8n packages are public on npm with provenance/,
  );
  assert.match(
    markdown,
    /LiteLLM open; Dify marketplace open; Vercel AI SDK open; ElizaOS registry open; LangChain docs open/,
  );
  assert.match(
    markdown,
    /npm @aipowergrid\/n8n-nodes-aipg@0\.1\.3 with provenance/,
  );

  const posts = markdown.split(/^### Post [0-9]+$/m).slice(1, 6);
  assert.equal(posts.length, 5);
  for (const [index, section] of posts.entries()) {
    const copy = section.split(/^## /m)[0].trim();
    assert.ok(
      [...copy].length <= 280,
      `post ${index + 1} exceeds 280 characters`,
    );
  }
});

test("weekly proof refuses unsupported schemas and economic validators", () => {
  assert.throws(
    () =>
      renderWeeklyProof({
        ...fixture,
        network: { ...fixture.network, schema: "future" },
      }),
    /unsupported network status schema/,
  );
  assert.throws(
    () =>
      renderWeeklyProof({
        ...fixture,
        network: {
          ...fixture.network,
          validators: {
            ...fixture.network.validators,
            economic_effect: "rewards",
          },
        },
      }),
    /reviewed before validators gain economic effect/,
  );
  assert.throws(
    () =>
      renderWeeklyProof({
        ...fixture,
        distribution: {
          ...fixture.distribution,
          packages: fixture.distribution.packages.map((item, index) =>
            index === 0 ? { ...item, provenance: false } : item,
          ),
        },
      }),
    /published package lacks provenance/,
  );
});

test("weekly proof fetches only the reviewed public evidence endpoints", async () => {
  const requested = [];
  let omitProvenance = false;
  const server = createServer((request, response) => {
    requested.push(request.url);
    const packageDocument = fixture.distribution.packages.find(
      (item) =>
        request.url === `/npm/${encodeURIComponent(item.name)}/${item.version}`,
    );
    const pullRequestDocument = fixture.distribution.pullRequests.find(
      (item) =>
        request.url === `/github/repos/${item.repository}/pulls/${item.number}`,
    );
    const body =
      request.url === "/v1/status/network"
        ? fixture.network
        : request.url === "/v1/stats/totals"
          ? fixture.totals
          : request.url === "/v1/payouts/public"
            ? fixture.payouts
            : packageDocument
              ? {
                  name: packageDocument.name,
                  version: packageDocument.version,
                  repository: {
                    url:
                      packageDocument.name === "@aipowergrid/n8n-nodes-aipg"
                        ? "git+https://github.com/AIPowerGrid/n8n-nodes-aipg.git"
                        : "git+https://github.com/AIPowerGrid/grid-provider-integrations.git",
                  },
                  dist: {
                    integrity: "sha512-fixture",
                    attestations: omitProvenance
                      ? undefined
                      : {
                          provenance: {
                            predicateType: "https://slsa.dev/provenance/v1",
                          },
                        },
                  },
                }
              : pullRequestDocument
                ? {
                    number: pullRequestDocument.number,
                    state: pullRequestDocument.state,
                    merged_at: pullRequestDocument.mergedAt,
                    html_url: pullRequestDocument.url,
                    base: {
                      repo: { full_name: pullRequestDocument.repository },
                    },
                  }
                : null;
    response.writeHead(body ? 200 : 404, {
      "content-type": "application/json",
    });
    response.end(JSON.stringify(body || { detail: "not found" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  try {
    const localBase = `http://127.0.0.1:${address.port}`;
    const markdown = await generateWeeklyProof({
      baseUrl: localBase,
      npmRegistryUrl: `${localBase}/npm`,
      githubApiUrl: `${localBase}/github`,
    });
    assert.match(markdown, /AI Power Grid Weekly Proof Post/);
    assert.deepEqual(requested.sort(), [
      "/github/repos/BerriAI/litellm/pulls/38725",
      "/github/repos/elizaOS/eliza/pulls/29964",
      "/github/repos/langchain-ai/docs/pulls/5770",
      "/github/repos/langgenius/dify-plugins/pulls/2986",
      "/github/repos/vercel/ai/pulls/20003",
      "/npm/%40aipowergrid%2Fai-sdk-provider/0.1.0",
      "/npm/%40aipowergrid%2Fn8n-nodes-aipg/0.1.3",
      "/npm/%40aipowergrid%2Fplugin-aipg/0.1.0",
      "/v1/payouts/public",
      "/v1/stats/totals",
      "/v1/status/network",
    ]);

    omitProvenance = true;
    await assert.rejects(
      () =>
        generateWeeklyProof({
          baseUrl: localBase,
          npmRegistryUrl: `${localBase}/npm`,
          githubApiUrl: `${localBase}/github`,
        }),
      /npm provenance is missing/,
    );
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
