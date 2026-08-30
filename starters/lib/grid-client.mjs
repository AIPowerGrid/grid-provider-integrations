import { createHash } from "node:crypto";

export const GRID_ORIGIN = "https://api.aipowergrid.io";
const DEFAULT_TIMEOUT_MS = 10 * 60_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_ERROR_BYTES = 2_000;

export class GridStarterError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GridStarterError";
    this.status = status;
  }
}

function normalizedBaseUrl(value) {
  const candidate = (value || GRID_ORIGIN).replace(/\/+$/, "");
  const parsed = new URL(candidate);
  const loopback = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("AIPG_BASE_URL must use HTTP or HTTPS");
  }
  if (candidate !== GRID_ORIGIN && !loopback) {
    throw new Error(`AIPG_BASE_URL must be ${GRID_ORIGIN} or a loopback test URL`);
  }
  if (candidate === GRID_ORIGIN && parsed.protocol !== "https:") {
    throw new Error("The production Grid API requires HTTPS");
  }
  return candidate;
}

function boundedText(value, max) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max)}...`;
}

function redact(value, secret) {
  return secret ? String(value).replaceAll(secret, "[REDACTED]") : String(value);
}

async function readBounded(response, limit = MAX_RESPONSE_BYTES) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > limit) throw new GridStarterError("Grid response exceeded the size limit", 502);
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel().catch(() => undefined);
      throw new GridStarterError("Grid response exceeded the size limit", 502);
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}

function finiteNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function maxCostUsd(environment = process.env) {
  const value = Number(environment.AIPG_MAX_COST_USD ?? "0.02");
  if (!Number.isFinite(value) || value <= 0 || value > 1) {
    throw new Error("AIPG_MAX_COST_USD quote limit must be greater than 0 and at most 1");
  }
  return value;
}

export function assertAffordable({ quote, credits, maximumUsd }) {
  const estimate = quote?.estimate;
  if (!estimate || estimate.priced !== true) {
    throw new GridStarterError("Grid returned an unpriced quote");
  }
  const hasUsd = typeof estimate.cost_usd === "number" && Number.isFinite(estimate.cost_usd);
  const hasMicro = typeof estimate.cost_micro === "number" && Number.isFinite(estimate.cost_micro);
  if (!hasUsd && !hasMicro) throw new GridStarterError("Grid quote omitted its cost");
  const costUsd = hasUsd ? estimate.cost_usd : estimate.cost_micro / 1_000_000;
  if (costUsd < 0 || costUsd > maximumUsd) {
    throw new GridStarterError(
      `Quoted cost $${costUsd.toFixed(6)} exceeds the $${maximumUsd.toFixed(2)} request limit`,
    );
  }
  const chargingEnabled = quote.charging_enabled ?? credits?.charging_enabled;
  const balanceSufficient = estimate.balance_sufficient;
  const spendable = finiteNumber(quote.total_spendable_usd ?? credits?.total_spendable_usd);
  if (
    chargingEnabled === true
    && (balanceSufficient === false || (balanceSufficient !== true && spendable < costUsd))
  ) {
    throw new GridStarterError("The Grid account does not have enough spendable credit");
  }
  return { costUsd, chargingEnabled: chargingEnabled === true };
}

export class GridStarterClient {
  constructor({
    apiKey = process.env.AIPG_API_KEY,
    baseUrl = process.env.AIPG_BASE_URL,
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = {}) {
    const key = apiKey?.trim();
    if (!key) {
      throw new Error(
        "AIPG_API_KEY is required. Create a scoped key at https://console.aipowergrid.io/dashboard/api-key",
      );
    }
    this.apiKey = key;
    this.baseUrl = normalizedBaseUrl(baseUrl);
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  async request(method, path, body, timeoutMs = this.timeoutMs) {
    const headers = { Accept: "application/json", Authorization: `Bearer ${this.apiKey}` };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    let response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new GridStarterError(redact(`Grid request failed on ${path}: ${detail}`, this.apiKey));
    }

    const raw = await readBounded(response, response.ok ? MAX_RESPONSE_BYTES : MAX_ERROR_BYTES);
    if (!response.ok) {
      let detail = raw || response.statusText;
      try {
        const parsed = JSON.parse(raw);
        detail = parsed.detail ?? parsed.error?.message ?? detail;
      } catch {
        // Bounded non-JSON errors are still safe to report.
      }
      throw new GridStarterError(
        redact(`Grid API ${response.status} on ${path}: ${boundedText(detail, 400)}`, this.apiKey),
        response.status,
      );
    }
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      throw new GridStarterError(`Grid API returned invalid JSON on ${path}`, 502);
    }
  }

  credits() {
    return this.request("GET", "/v1/account/credits");
  }

  quote(body) {
    return this.request("POST", "/v1/account/credits/quote", body, 30_000);
  }

  text({ prompt, system, model = "auto", maxTokens = 512, temperature = 0.5 }) {
    const messages = [];
    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: prompt });
    return this.request("POST", "/v1/chat/completions", {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }, 180_000);
  }

  image({ prompt, model = "Krea 2 Turbo", size = "1024x1024", seed }) {
    return this.request("POST", "/v1/images/generations", {
      model,
      prompt,
      n: 1,
      size,
      response_format: "url",
      ...(seed === undefined ? {} : { seed }),
    }, 300_000);
  }

  video({ prompt, model = "LTX Director 2.0", size = "768x512", seconds = 4, fps = 24, seed }) {
    return this.request("POST", "/v1/videos/generations", {
      model,
      prompt,
      n: 1,
      size,
      seconds,
      fps,
      response_format: "url",
      ...(seed === undefined ? {} : { seed }),
    }, 600_000);
  }

  audio({ prompt, model = "ace-step-v1.5-xl-turbo", seconds = 30, seed }) {
    return this.request("POST", "/v1/audio/generations", {
      model,
      prompt,
      lyrics: "",
      seconds,
      inference_steps: 8,
      ...(seed === undefined ? {} : { seed }),
    }, 600_000);
  }
}

export async function preflight(client, quoteRequest, maximumUsd) {
  const quote = await client.quote(quoteRequest);
  return { quote, ...assertAffordable({ quote, credits: quote, maximumUsd }) };
}

export function conservativeTokenEstimate(...parts) {
  return parts.reduce((total, part) => total + new TextEncoder().encode(String(part ?? "")).byteLength, 0);
}

export function textContent(response) {
  const choice = response?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new GridStarterError("Grid returned an empty text completion", 502);
  }
  if (choice.finish_reason === "length") {
    throw new GridStarterError("Grid reached the output limit; refusing partial output", 502);
  }
  return content.trim();
}

export function mediaReceipt(response) {
  const item = Array.isArray(response?.data) ? response.data[0] : undefined;
  const url = item?.url;
  if (typeof url !== "string" || !url.startsWith("https://")) {
    throw new GridStarterError("Grid returned no HTTPS media URL", 502);
  }
  const jobId = typeof response?.grid?.job_id === "string" ? response.grid.job_id : undefined;
  if (!jobId) {
    throw new GridStarterError("Grid returned media without a job receipt ID", 502);
  }
  return {
    url,
    seed: Number.isInteger(item.seed) ? item.seed : undefined,
    jobId,
    model: typeof response?.grid?.model === "string" ? response.grid.model : undefined,
  };
}

export function sha256(value) {
  return `0x${createHash("sha256").update(String(value)).digest("hex")}`;
}

export function requireText(value, name, maxLength = 4_000) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${name} is required`);
  if (text.length > maxLength) throw new Error(`${name} must be at most ${maxLength} characters`);
  return text;
}

export function printJson(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}
