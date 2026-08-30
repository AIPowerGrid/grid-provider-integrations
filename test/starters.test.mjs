import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import {
  GridStarterClient,
  assertAffordable,
  conservativeTokenEstimate,
  mediaReceipt,
} from "../starters/lib/grid-client.mjs";
import { runNpc } from "../starters/onchain-game-npc/index.mjs";
import { runDaoMedia } from "../starters/dao-media-pipeline/index.mjs";
import { runNftWorkflow } from "../starters/nft-media-workflow/index.mjs";
import { createTelegramAgent } from "../starters/telegram-agent/index.mjs";
import { runWalletFundedAgent } from "../starters/wallet-funded-agent/index.mjs";

const credits = { total_spendable_usd: 5, charging_enabled: true };
const textResponse = {
  model: "model-a",
  choices: [{ message: { content: "FINAL: Build it carefully." }, finish_reason: "stop" }],
  grid: { worker: "community-worker" },
};
const mediaResponse = {
  data: [{ url: "https://media.example/result.webp", seed: 42 }],
  grid: { job_id: "job-123", model: "image-a" },
};

function mockClient() {
  return {
    credits: async () => credits,
    quote: async (request) => ({
      charging_enabled: true,
      total_spendable_usd: 5,
      estimate: {
        priced: true,
        balance_sufficient: true,
        cost_usd: request.modality === "text" ? 0.001 : 0.005,
      },
    }),
    text: async () => textResponse,
    image: async () => mediaResponse,
    video: async () => mediaResponse,
    audio: async () => mediaResponse,
  };
}

test("starter client fixes production origin and redacts its key", async () => {
  assert.throws(
    () => new GridStarterClient({ apiKey: "secret", baseUrl: "https://attacker.example" }),
    /must be https:\/\/api\.aipowergrid\.io/,
  );
  const client = new GridStarterClient({
    apiKey: "grid-secret-value",
    baseUrl: "http://127.0.0.1:9999",
    fetchImpl: async () => {
      throw new Error("connection failed for grid-secret-value");
    },
  });
  await assert.rejects(
    () => client.credits(),
    (error) => !error.message.includes("grid-secret-value") && error.message.includes("[REDACTED]"),
  );
});

test("starter client rejects oversized bodies before parsing", async () => {
  const client = new GridStarterClient({
    apiKey: "secret",
    baseUrl: "http://127.0.0.1:9999",
    fetchImpl: async () => new Response("{}", {
      status: 200,
      headers: { "content-length": String(3 * 1024 * 1024) },
    }),
  });
  await assert.rejects(() => client.credits(), /size limit/);
});

test("quote guard rejects unpriced, over-budget, and underfunded work", () => {
  assert.throws(
    () => assertAffordable({ quote: { estimate: { priced: false } }, credits, maximumUsd: 0.02 }),
    /unpriced/,
  );
  assert.throws(
    () => assertAffordable({
      quote: { charging_enabled: true, estimate: { priced: true } },
      credits,
      maximumUsd: 0.02,
    }),
    /omitted its cost/,
  );
  assert.throws(
    () => assertAffordable({
      quote: {
        charging_enabled: true,
        estimate: { priced: true, cost_usd: 0.03, balance_sufficient: true },
      },
      credits,
      maximumUsd: 0.02,
    }),
    /exceeds/,
  );
  assert.throws(
    () => assertAffordable({
      quote: {
        charging_enabled: true,
        total_spendable_usd: 5,
        estimate: { priced: true, cost_usd: 0.01, balance_sufficient: false },
      },
      credits: { total_spendable_usd: 0 },
      maximumUsd: 0.02,
    }),
    /enough spendable/,
  );
});

test("token estimates conservatively include UTF-8 input bytes", () => {
  assert.equal(conservativeTokenEstimate("abc", "\u00e9"), 5);
});

test("media receipts retain job IDs without claiming an anchor", () => {
  assert.deepEqual(mediaReceipt(mediaResponse), {
    url: "https://media.example/result.webp",
    seed: 42,
    jobId: "job-123",
    model: "image-a",
  });
  assert.throws(
    () => mediaReceipt({ data: [{ url: "http://insecure.example/file" }] }),
    /HTTPS media URL/,
  );
  assert.throws(
    () => mediaReceipt({ data: [{ url: "https://media.example/file" }], grid: {} }),
    /job receipt ID/,
  );
});

test("NPC starter quotes, generates, and emits an application receipt", async () => {
  const result = await runNpc({
    action: "Ask about the bridge",
    environment: { AIPG_MAX_COST_USD: "0.02" },
    client: mockClient(),
  });
  assert.equal(result.dialogue, "FINAL: Build it carefully.");
  assert.match(result.receipt.inputHash, /^0x[0-9a-f]{64}$/);
  assert.equal(result.receipt.onchainAnchorVerified, false);
});

test("DAO and NFT starters preserve Grid provenance", async () => {
  const dao = await runDaoMedia({
    environment: { DAO_PROPOSAL: "Fund public GPU onboarding", AIPG_MAX_COST_USD: "0.02" },
    client: mockClient(),
  });
  assert.equal(dao.grid.jobId, "job-123");
  assert.equal(dao.grid.onchainAnchorVerified, false);

  const daoAudio = await runDaoMedia({
    environment: {
      DAO_PROPOSAL: "Compose a governance recap",
      DAO_MEDIA_TYPE: "audio",
      AIPG_MAX_COST_USD: "0.02",
    },
    client: mockClient(),
  });
  assert.equal(daoAudio.mediaType, "audio");
  assert.equal(daoAudio.grid.jobId, "job-123");

  const nft = await runNftWorkflow({
    environment: {
      NFT_NAME: "Grid Genesis",
      NFT_PROMPT: "A public GPU city",
      AIPG_MAX_COST_USD: "0.02",
    },
    client: mockClient(),
    write: false,
  });
  assert.equal(nft.metadata.image, "https://media.example/result.webp");
  assert.equal(nft.metadata.aipg.jobId, "job-123");
  assert.equal(nft.metadata.aipg.onchainAnchorVerified, false);
});

test("wallet-funded agent refuses wallet keys and obeys its bounded loop", async () => {
  await assert.rejects(
    () => runWalletFundedAgent({
      environment: { AGENT_TASK: "Plan", PRIVATE_KEY: "0xsecret" },
      client: mockClient(),
    }),
    /Remove wallet private keys/,
  );
  const result = await runWalletFundedAgent({
    environment: {
      AGENT_TASK: "Plan proposal 42",
      AGENT_STEPS: "3",
      AIPG_MIN_BALANCE_USD: "0.05",
      AIPG_MAX_COST_USD: "0.02",
    },
    client: mockClient(),
  });
  assert.equal(result.stepsCompleted, 1, "FINAL output should stop the loop");
  assert.equal(result.funding.walletPrivateKeyUsed, false);
});

test("Telegram starter authenticates and restricts chats before Grid dispatch", async () => {
  let generated = 0;
  let telegramBody;
  const client = {
    ...mockClient(),
    text: async () => {
      generated += 1;
      return textResponse;
    },
  };
  let resolveSent;
  const sent = new Promise((resolve) => {
    resolveSent = resolve;
  });
  const webhookSecret = ["test", "webhook", "value"].join("-");
  const server = createTelegramAgent({
    environment: {
      TELEGRAM_BOT_TOKEN: "123:telegram-secret",
      TELEGRAM_WEBHOOK_SECRET: webhookSecret,
      TELEGRAM_ALLOWED_CHAT_IDS: "42",
      TELEGRAM_ALLOWED_USER_IDS: "7",
      AIPG_MAX_COST_USD: "0.02",
    },
    client,
    fetchImpl: async (_url, init) => {
      telegramBody = JSON.parse(init.body);
      resolveSent();
      return new Response('{"ok":true}', { status: 200 });
    },
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  try {
    const unauthorized = await fetch(`http://127.0.0.1:${port}/telegram`, {
      method: "POST",
      body: "{}",
    });
    assert.equal(unauthorized.status, 401);

    const accepted = await fetch(`http://127.0.0.1:${port}/telegram`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-telegram-bot-api-secret-token": webhookSecret,
      },
      body: JSON.stringify({
        update_id: 1,
        message: { chat: { id: 42 }, from: { id: 7 }, text: "hello" },
      }),
    });
    assert.equal(accepted.status, 202);
    await Promise.race([
      sent,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Telegram send timed out")), 1_000)),
    ]);
    assert.equal(generated, 1);
    assert.deepEqual(telegramBody, { chat_id: "42", text: "FINAL: Build it carefully." });

    const replay = await fetch(`http://127.0.0.1:${port}/telegram`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-telegram-bot-api-secret-token": webhookSecret,
      },
      body: JSON.stringify({
        update_id: 1,
        message: { chat: { id: 42 }, from: { id: 7 }, text: "hello again" },
      }),
    });
    assert.equal(replay.status, 202);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(generated, 1, "a replayed update must not dispatch paid work twice");

    const wrongUser = await fetch(`http://127.0.0.1:${port}/telegram`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-telegram-bot-api-secret-token": webhookSecret,
      },
      body: JSON.stringify({
        update_id: 2,
        message: { chat: { id: 42 }, from: { id: 99 }, text: "spend credits" },
      }),
    });
    assert.equal(wrongUser.status, 202);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(generated, 1, "a disallowed sender must not dispatch paid work");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
