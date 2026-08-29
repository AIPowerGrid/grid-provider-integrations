#!/usr/bin/env node

import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import {
  GridStarterClient,
  conservativeTokenEstimate,
  maxCostUsd,
  preflight,
  requireText,
  textContent,
} from "../lib/grid-client.mjs";

const MAX_WEBHOOK_BYTES = 32 * 1024;
const TELEGRAM_SYSTEM = "You are a concise community assistant. Answer only the user's current message. Never claim that an on-chain action happened.";
const HELP = `Usage: node starters/telegram-agent/index.mjs

Required environment:
  AIPG_API_KEY
  TELEGRAM_BOT_TOKEN
  TELEGRAM_WEBHOOK_SECRET
  TELEGRAM_ALLOWED_CHAT_IDS  comma-separated numeric chat IDs

Optional: PORT (default 8788), AIPG_TEXT_MODEL, AIPG_MAX_COST_USD`;

function safeEqual(left, right) {
  const a = Buffer.from(String(left ?? ""));
  const b = Buffer.from(String(right ?? ""));
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

async function readWebhook(request) {
  const declared = Number(request.headers["content-length"] || 0);
  if (declared > MAX_WEBHOOK_BYTES) throw new Error("request too large");
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_WEBHOOK_BYTES) throw new Error("request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function sendTelegram({ botToken, chatId, text, fetchImpl = globalThis.fetch }) {
  const response = await fetchImpl(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4_000) }),
  });
  if (!response.ok) throw new Error(`Telegram send failed with status ${response.status}`);
}

export function createTelegramAgent({ environment = process.env, client, fetchImpl = globalThis.fetch } = {}) {
  const botToken = requireText(environment.TELEGRAM_BOT_TOKEN, "TELEGRAM_BOT_TOKEN", 256);
  const webhookSecret = requireText(
    environment.TELEGRAM_WEBHOOK_SECRET,
    "TELEGRAM_WEBHOOK_SECRET",
    256,
  );
  if (webhookSecret.length < 16) throw new Error("TELEGRAM_WEBHOOK_SECRET must be at least 16 characters");
  const allowed = new Set(
    requireText(environment.TELEGRAM_ALLOWED_CHAT_IDS, "TELEGRAM_ALLOWED_CHAT_IDS", 2_000)
      .split(",")
      .map((value) => value.trim())
      .filter((value) => /^-?\d+$/.test(value)),
  );
  if (allowed.size === 0) throw new Error("TELEGRAM_ALLOWED_CHAT_IDS contains no valid chat IDs");
  const api = client ?? new GridStarterClient({ fetchImpl });
  const model = environment.AIPG_TEXT_MODEL || "auto";
  const inFlightChats = new Set();

  async function processUpdate(update) {
    const message = update?.message;
    const chatId = String(message?.chat?.id ?? "");
    const prompt = typeof message?.text === "string" ? message.text.trim() : "";
    if (!allowed.has(chatId) || !prompt || prompt.length > 2_000 || inFlightChats.has(chatId)) return;
    inFlightChats.add(chatId);
    try {
      await preflight(api, {
        model,
        modality: "text",
        prompt_tokens: conservativeTokenEstimate(TELEGRAM_SYSTEM, prompt),
        max_tokens: 384,
        n: 1,
      }, maxCostUsd(environment));
      const response = await api.text({
        model,
        system: TELEGRAM_SYSTEM,
        prompt,
        maxTokens: 384,
        temperature: 0.4,
      });
      await sendTelegram({ botToken, chatId, text: textContent(response), fetchImpl });
    } catch {
      await sendTelegram({
        botToken,
        chatId,
        text: "The Grid could not complete that request. Please try again shortly.",
        fetchImpl,
      }).catch(() => undefined);
    } finally {
      inFlightChats.delete(chatId);
    }
  }

  return createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end('{"ok":true}');
      return;
    }
    if (request.method !== "POST" || request.url !== "/telegram") {
      response.writeHead(404).end();
      return;
    }
    if (!safeEqual(request.headers["x-telegram-bot-api-secret-token"], webhookSecret)) {
      response.writeHead(401).end();
      return;
    }
    try {
      const update = await readWebhook(request);
      response.writeHead(202).end();
      void processUpdate(update);
    } catch {
      response.writeHead(400).end();
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(`${HELP}\n`);
  } else {
    const port = Number(process.env.PORT ?? 8788);
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      throw new Error("PORT must be an integer from 1 to 65535");
    }
    const server = createTelegramAgent();
    server.listen(port, "127.0.0.1", () => {
      process.stdout.write(`Telegram agent listening on http://127.0.0.1:${port}\n`);
    });
  }
}
