const DEFAULT_BASE_URL = "https://api.aipowergrid.io";
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_STREAM_BYTES = 1_000_000;

function normalizedBaseUrl(value) {
  const url = new URL(value || DEFAULT_BASE_URL);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error("Conformance targets must use HTTPS unless they are loopback-local.");
  }
  url.pathname = url.pathname.replace(/\/(?:v1\/?|$)$/, "").replace(/\/$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function result(name, startedAt, details = {}) {
  return {
    name,
    ok: true,
    duration_ms: Date.now() - startedAt,
    ...details,
  };
}

function assertion(condition, message) {
  if (!condition) throw new Error(message);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function request(baseUrl, path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
  const headers = new Headers({ Accept: "application/json" });
  if (options.apiKey) headers.set("Authorization", `Bearer ${options.apiKey}`);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  try {
    return await fetch(`${baseUrl}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      redirect: "error",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function json(response) {
  const contentType = response.headers.get("content-type") || "";
  assertion(contentType.includes("application/json"), `expected JSON, received ${contentType || "unknown content type"}`);
  return response.json();
}

async function runCheck(checks, name, check) {
  const startedAt = Date.now();
  try {
    checks.push(await check(startedAt));
  } catch (error) {
    checks.push({
      name,
      ok: false,
      duration_ms: Date.now() - startedAt,
      error: errorMessage(error),
    });
  }
}

function quotePayload(model) {
  if (model.type === "text") {
    return { model: model.name, modality: "text", prompt_tokens: 8, max_tokens: 8 };
  }
  if (model.type === "image") return { model: model.name, modality: "image", n: 1 };
  if (model.type === "audio") return { model: model.name, modality: "audio", seconds: 10 };
  return { model: model.name, modality: "video", seconds: 1 };
}

async function readBoundedStream(response) {
  assertion(response.body, "streaming response has no body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  let bytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    assertion(bytes <= MAX_STREAM_BYTES, "stream exceeded the conformance size limit");
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();
  return { raw, bytes };
}

function inspectSse(raw) {
  let chunks = 0;
  let contentDeltas = 0;
  let sawDone = false;
  let sawFinish = false;

  for (const line of raw.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (data === "[DONE]") {
      sawDone = true;
      continue;
    }
    const event = JSON.parse(data);
    assertion(event.object === "chat.completion.chunk", "unexpected stream object");
    chunks += 1;
    const choice = event.choices?.[0];
    if (typeof choice?.delta?.content === "string" && choice.delta.content) contentDeltas += 1;
    if (choice?.finish_reason) sawFinish = true;
  }
  assertion(chunks > 0, "stream contained no completion chunks");
  assertion(sawDone, "stream did not terminate with [DONE]");
  assertion(sawFinish, "stream did not report a finish reason");
  return { chunks, content_deltas: contentDeltas, done: sawDone, finish_reason_seen: sawFinish };
}

export async function runConformance(options = {}) {
  const baseUrl = normalizedBaseUrl(options.baseUrl || DEFAULT_BASE_URL);
  const apiKey = options.apiKey || null;
  const account = Boolean(options.account || options.liveText);
  const liveText = Boolean(options.liveText);
  const model = options.model || "auto";
  if (account && !apiKey) throw new Error("Account checks require an API key supplied through the environment.");

  const checks = [];
  let clientModels = new Set();
  let statusModels = [];

  await runCheck(checks, "service.discovery", async (startedAt) => {
    const response = await request(baseUrl, "/");
    assertion(response.status === 200, `expected 200, received ${response.status}`);
    const body = await json(response);
    assertion(body?.endpoints?.openai === "POST /v1/chat/completions", "chat endpoint is not advertised");
    assertion(body?.endpoints?.models === "GET /v1/models", "model endpoint is not advertised");
    return result("service.discovery", startedAt, { status: response.status });
  });

  await runCheck(checks, "models.openai_list", async (startedAt) => {
    const response = await request(baseUrl, "/v1/models");
    assertion(response.status === 200, `expected 200, received ${response.status}`);
    const body = await json(response);
    assertion(body?.object === "list" && Array.isArray(body.data), "invalid OpenAI model-list shape");
    assertion(body.data.every((entry) => typeof entry.id === "string" && entry.id), "model entry is missing an id");
    clientModels = new Set(body.data.map((entry) => entry.id));
    return result("models.openai_list", startedAt, { status: response.status, models: body.data.length });
  });

  await runCheck(checks, "models.modality_status", async (startedAt) => {
    const response = await request(baseUrl, "/v1/status/models");
    assertion(response.status === 200, `expected 200, received ${response.status}`);
    const body = await json(response);
    assertion(Array.isArray(body), "status model response is not an array");
    assertion(
      body.every((entry) => typeof entry.name === "string" && Number.isInteger(entry.count) && entry.count >= 0),
      "invalid status model entry",
    );
    const textModels = body.filter((entry) => entry.type === "text");
    const capabilityModels = body.filter((entry) => entry.type === "image" || entry.type === "video");
    assertion(
      textModels.every((entry) => Number.isInteger(entry.max_context_length) && entry.max_context_length > 0),
      "text status entry is missing a positive context window",
    );
    assertion(
      capabilityModels.every((entry) => Array.isArray(entry.capabilities) && entry.capabilities.length > 0),
      "image or video status entry is missing capability metadata",
    );
    const undiscoverable = textModels.map((entry) => entry.name).filter((name) => !clientModels.has(name));
    assertion(undiscoverable.length === 0, `online text models missing from /v1/models: ${undiscoverable.join(", ")}`);
    statusModels = body;
    const modalities = [...new Set(body.map((entry) => entry.type))].sort();
    return result("models.modality_status", startedAt, {
      status: response.status,
      models: body.length,
      modalities,
      text_contexts: textModels.length,
      capability_models: capabilityModels.length,
    });
  });

  const authBody = { model: "auto", messages: [{ role: "user", content: "conformance" }], max_tokens: 1 };
  await runCheck(checks, "auth.missing", async (startedAt) => {
    const response = await request(baseUrl, "/v1/chat/completions", { method: "POST", body: authBody });
    assertion(response.status === 401, `expected 401, received ${response.status}`);
    await json(response);
    return result("auth.missing", startedAt, { status: response.status });
  });

  await runCheck(checks, "auth.invalid", async (startedAt) => {
    const response = await request(baseUrl, "/v1/chat/completions", {
      method: "POST",
      apiKey: "grid_conformance_invalid_not_a_credential",
      body: authBody,
    });
    assertion(response.status === 401, `expected 401, received ${response.status}`);
    await json(response);
    return result("auth.invalid", startedAt, { status: response.status });
  });

  if (account) {
    await runCheck(checks, "models.missing", async (startedAt) => {
      const response = await request(baseUrl, "/v1/models/__aipg_conformance_missing__", { apiKey });
      assertion(response.status === 404, `expected 404, received ${response.status}`);
      await json(response);
      return result("models.missing", startedAt, { status: response.status });
    });

    await runCheck(checks, "account.credits", async (startedAt) => {
      const response = await request(baseUrl, "/v1/account/credits", { apiKey });
      assertion(response.status === 200, `expected 200, received ${response.status}`);
      const body = await json(response);
      assertion(typeof body.charging_enabled === "boolean", "credit summary is missing charging_enabled");
      assertion(typeof body.charging_mode === "string", "credit summary is missing charging_mode");
      return result("account.credits", startedAt, { status: response.status, charging_mode: body.charging_mode });
    });

    const representatives = [...new Map(statusModels.map((entry) => [entry.type, entry])).values()];
    for (const representative of representatives) {
      await runCheck(checks, `quote.${representative.type}`, async (startedAt) => {
        const response = await request(baseUrl, "/v1/account/credits/quote", {
          method: "POST",
          apiKey,
          body: quotePayload(representative),
        });
        assertion(response.status === 200, `expected 200, received ${response.status}`);
        const body = await json(response);
        assertion(typeof body.cost_micro === "number" && body.cost_micro >= 0, "quote is missing cost_micro");
        assertion(body.modality === representative.type, "quote modality does not match request");
        return result(`quote.${representative.type}`, startedAt, {
          status: response.status,
          model: representative.name,
          priced: body.priced,
          cost_micro: body.cost_micro,
          charging_enabled: body.charging_enabled,
        });
      });
    }
  }

  if (liveText) {
    await runCheck(checks, "text.streaming", async (startedAt) => {
      const response = await request(baseUrl, "/v1/chat/completions", {
        method: "POST",
        apiKey,
        timeoutMs: options.liveTimeoutMs || 60_000,
        body: {
          model,
          messages: [{ role: "user", content: "Reply with the single word ready." }],
          max_tokens: 8,
          temperature: 0,
          stream: true,
        },
      });
      assertion(response.status === 200, `expected 200, received ${response.status}`);
      assertion((response.headers.get("content-type") || "").includes("text/event-stream"), "stream has the wrong content type");
      const stream = await readBoundedStream(response);
      return result("text.streaming", startedAt, { status: response.status, bytes: stream.bytes, ...inspectSse(stream.raw) });
    });
  }

  return {
    schema: "aipg.provider-conformance.v1",
    target: baseUrl,
    mode: liveText ? "live-text" : account ? "account" : "public",
    generated_at: new Date().toISOString(),
    ok: checks.every((check) => check.ok),
    checks,
  };
}
