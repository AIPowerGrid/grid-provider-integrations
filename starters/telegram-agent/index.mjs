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
const MAX_RECENT_UPDATES = 1_000;
const TELEGRAM_SYSTEM = "You are a concise community assistant. Answer only the user's current message. Never claim that an on-chain action happened.";
const HELP = `Usage: node starters/telegram-agent/index.mjs

Required environment:
  AIPG_API_KEY
  TELEGRAM_BOT_TOKEN
  TELEGRAM_WEBHOOK_SECRET
  TELEGRAM_ALLOWED_CHAT_IDS  comma-separated numeric chat IDs

Optional:
  TELEGRAM_ALLOWED_USER_IDS  comma-separated numeric sender IDs; require for shared chats
  PORT                       default: 8788
  AIPG_TEXT_MODEL
  AIPG_MAX_COST_USD          maximum accepted preflight quote, default: 0.02`;

function safeEqual(left, right) {
  const a = Buffer.from(String(left ?? ""));
  const b = Buffer.from(String(right ?? ""));
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

function numericIdSet(value, name, { required = true } = {}) {
  const source = String(value ?? "").trim();
  if (!source && !required) return new Set();
  const entries = requireText(source, name, 2_000).split(",").map((item) => item.trim());
  if (entries.some((item) => !/^-?\d+$/.test(item))) {
    throw new Error(`${name} must contain only comma-separated numeric IDs`);
  }
  return new Set(entries);
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
  const allowedChats = numericIdSet(environment.TELEGRAM_ALLOWED_CHAT_IDS, "TELEGRAM_ALLOWED_CHAT_IDS");
  const allowedUsers = numericIdSet(
    environment.TELEGRAM_ALLOWED_USER_IDS,
    "TELEGRAM_ALLOWED_USER_IDS",
    { required: false },
  );
  const api = client ?? new GridStarterClient({ fetchImpl });
  const model = environment.AIPG_TEXT_MODEL || "auto";
  const inFlightChats = new Set();
  const recentUpdateIds = new Set();

  function rememberUpdate(updateId) {
    if (!Number.isSafeInteger(updateId)) return true;
    const key = String(updateId);
    if (recentUpdateIds.has(key)) return false;
    recentUpdateIds.add(key);
    if (recentUpdateIds.size > MAX_RECENT_UPDATES) {
      recentUpdateIds.delete(recentUpdateIds.values().next().value);
    }
    return true;
  }

  async function processUpdate(update) {
    const message = update?.message;
    const chatId = String(message?.chat?.id ?? "");
    const userId = String(message?.from?.id ?? "");
    const prompt = typeof message?.text === "string" ? message.text.trim() : "";
    if (
      !allowedChats.has(chatId)
      || (allowedUsers.size > 0 && !allowedUsers.has(userId))
      || !prompt
      || prompt.length > 2_000
      || inFlightChats.has(chatId)
      || !rememberUpdate(update?.update_id)
    ) return;
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
