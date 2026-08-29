import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { generateWeeklyProof, renderWeeklyProof } from "../src/weekly-proof.mjs";

const fixture = {
  network: {
    schema: "aipg.network.status.v1",
    generated_at: "2026-08-29T05:44:17.407Z",
    capacity: {
      workers_online: 8,
      models_online: 11,
      redundancy_target: 3,
      models_below_target: Array.from({ length: 11 }, (_, index) => `model-${index}`),
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
  payouts: { totals: { aipg_paid: 63882.7109, payouts: 1265, workers_paid: 8 } },
};

test("weekly proof derives arithmetic and preserves trust boundaries", () => {
  const markdown = renderWeeklyProof(fixture);

  assert.match(markdown, /60,629 recorded jobs all time/);
  assert.match(markdown, /2,765 in the current\s+24-hour statistics window/);
  assert.match(markdown, /63,882\.7109 AIPG across 1,265 on-chain Base/);
  assert.match(markdown, /95\.3% agreement/);
  assert.match(markdown, /0 validator operators are\s+independently verified/);
  assert.match(markdown, /does not prove a paid-request count/);
  assert.match(markdown, /does not identify independent worker ownership, external builders, or historical uptime/);
  assert.match(markdown, /not an uptime\s+promise, a paid-demand claim, proof of operator independence/);
});

test("weekly proof refuses unsupported schemas and economic validators", () => {
  assert.throws(
    () => renderWeeklyProof({ ...fixture, network: { ...fixture.network, schema: "future" } }),
    /unsupported network status schema/,
  );
  assert.throws(
    () =>
      renderWeeklyProof({
        ...fixture,
        network: {
          ...fixture.network,
          validators: { ...fixture.network.validators, economic_effect: "rewards" },
        },
      }),
    /reviewed before validators gain economic effect/,
  );
});

test("weekly proof fetches only the three public evidence endpoints", async () => {
  const requested = [];
  const server = createServer((request, response) => {
    requested.push(request.url);
    const body =
      request.url === "/v1/status/network"
        ? fixture.network
        : request.url === "/v1/stats/totals"
          ? fixture.totals
          : request.url === "/v1/payouts/public"
            ? fixture.payouts
            : null;
    response.writeHead(body ? 200 : 404, { "content-type": "application/json" });
    response.end(JSON.stringify(body || { detail: "not found" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  try {
    const markdown = await generateWeeklyProof({ baseUrl: `http://127.0.0.1:${address.port}` });
    assert.match(markdown, /AI Power Grid Weekly Proof Post/);
    assert.deepEqual(requested.sort(), [
      "/v1/payouts/public",
      "/v1/stats/totals",
      "/v1/status/network",
    ]);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
