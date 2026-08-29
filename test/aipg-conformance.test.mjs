import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { runConformance } from "../src/aipg-conformance.mjs";

function replyJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

async function mockGrid(handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

function routes(request, response) {
  const auth = request.headers.authorization;
  if (request.url === "/") {
    return replyJson(response, 200, { endpoints: { openai: "POST /v1/chat/completions", models: "GET /v1/models" } });
  }
  if (request.url === "/v1/models") {
    return replyJson(response, 200, { object: "list", data: [{ id: "model-a", object: "model" }] });
  }
  if (request.url === "/v1/status/models") {
    return replyJson(response, 200, [
      { name: "model-a", count: 1, type: "text", max_context_length: 60000 },
      { name: "image-a", count: 1, type: "image", max_context_length: 2048 },
    ]);
  }
  if (request.url === "/v1/models/__aipg_conformance_missing__") {
    if (auth !== "Bearer secret-test-key") return replyJson(response, 403, { detail: "local session required" });
    return replyJson(response, 404, { detail: "not found" });
  }
  if (request.url === "/v1/chat/completions" && auth !== "Bearer secret-test-key") {
    return replyJson(response, 401, { detail: "invalid key" });
  }
  if (request.url === "/v1/account/credits") {
    if (auth !== "Bearer secret-test-key") return replyJson(response, 401, { detail: "invalid key" });
    return replyJson(response, 200, { charging_enabled: true, charging_mode: "enforce", paid_micro: 1234 });
  }
  if (request.url === "/v1/account/credits/quote") {
    if (auth !== "Bearer secret-test-key") return replyJson(response, 401, { detail: "invalid key" });
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", () => {
      const body = JSON.parse(raw);
      replyJson(response, 200, {
        modality: body.modality,
        cost_micro: body.modality === "text" ? 1 : 5000,
        priced: true,
        charging_enabled: true,
      });
    });
    return;
  }
  if (request.url === "/v1/chat/completions" && auth === "Bearer secret-test-key") {
    response.writeHead(200, { "content-type": "text/event-stream" });
    response.end([
      'data: {"object":"chat.completion.chunk","choices":[{"delta":{"content":"ready"},"finish_reason":null}]}',
      "",
      'data: {"object":"chat.completion.chunk","choices":[{"delta":{},"finish_reason":"stop"}]}',
      "",
      "data: [DONE]",
      "",
    ].join("\n"));
    return;
  }
  replyJson(response, 404, { detail: "unexpected route" });
}

test("public mode verifies discovery and auth boundaries without a key", async () => {
  const grid = await mockGrid(routes);
  try {
    const report = await runConformance({ baseUrl: grid.baseUrl });
    assert.equal(report.ok, true);
    assert.equal(report.mode, "public");
    assert.deepEqual(report.checks.map((entry) => entry.name), [
      "service.discovery",
      "models.openai_list",
      "models.modality_status",
      "auth.missing",
      "auth.invalid",
    ]);
    assert.equal(JSON.stringify(report).includes("secret-test-key"), false);
  } finally {
    await grid.close();
  }
});

test("account mode validates summaries and one quote per online modality", async () => {
  const grid = await mockGrid(routes);
  try {
    const report = await runConformance({ baseUrl: grid.baseUrl, apiKey: "secret-test-key", account: true });
    assert.equal(report.ok, true);
    assert.deepEqual(report.checks.slice(-4).map((entry) => entry.name), [
      "models.missing",
      "account.credits",
      "quote.text",
      "quote.image",
    ]);
    assert.equal(JSON.stringify(report).includes("1234"), false, "balance must not enter the report");
  } finally {
    await grid.close();
  }
});

test("live text mode validates SSE structure without retaining content", async () => {
  const grid = await mockGrid(routes);
  try {
    const report = await runConformance({
      baseUrl: grid.baseUrl,
      apiKey: "secret-test-key",
      account: true,
      liveText: true,
      model: "model-a",
    });
    assert.equal(report.ok, true);
    assert.equal(report.checks.at(-1).name, "text.streaming");
    assert.equal(report.checks.at(-1).done, true);
    assert.equal(JSON.stringify(report).includes("ready"), false, "generated text must not enter the report");
  } finally {
    await grid.close();
  }
});

test("account mode refuses to run without an environment-supplied key", async () => {
  await assert.rejects(() => runConformance({ account: true }), /require an API key/);
});

test("non-loopback HTTP targets are rejected", async () => {
  await assert.rejects(() => runConformance({ baseUrl: "http://api.example.com" }), /must use HTTPS/);
});

test("public mode rejects text models without a positive context window", async () => {
  const invalidRoutes = (request, response) => {
    if (request.url === "/v1/status/models") {
      return replyJson(response, 200, [{ name: "model-a", count: 1, type: "text", max_context_length: null }]);
    }
    return routes(request, response);
  };
  const grid = await mockGrid(invalidRoutes);
  try {
    const report = await runConformance({ baseUrl: grid.baseUrl });
    assert.equal(report.ok, false);
    assert.match(
      report.checks.find((entry) => entry.name === "models.modality_status").error,
      /positive context window/,
    );
  } finally {
    await grid.close();
  }
});
