#!/usr/bin/env node

const baseUrl = "https://api.aipowergrid.io/v1";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const modelsResponse = await fetch(`${baseUrl}/models`);
assert(modelsResponse.status === 200, `/models returned ${modelsResponse.status}`);
const models = await modelsResponse.json();
assert(models?.object === "list" && Array.isArray(models.data), "invalid /models response");
assert(models.data.some((entry) => entry.id === "auto"), "auto model is missing");

const authResponse = await fetch(`${baseUrl}/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "auto",
    messages: [{ role: "user", content: "connection check" }],
    max_tokens: 1,
  }),
});
assert(authResponse.status === 401, `missing auth returned ${authResponse.status}, expected 401`);

const corsResponse = await fetch(`${baseUrl}/chat/completions`, {
  method: "OPTIONS",
  headers: {
    Origin: "https://open-webui.example",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "authorization,content-type",
  },
});
assert(corsResponse.status === 200, `CORS preflight returned ${corsResponse.status}`);
assert(
  corsResponse.headers.get("access-control-allow-origin") === "*",
  "Grid does not currently allow the Direct Connection origin",
);
const allowedHeaders = corsResponse.headers.get("access-control-allow-headers") ?? "";
assert(allowedHeaders.includes("authorization"), "CORS does not allow Authorization");
assert(allowedHeaders.includes("content-type"), "CORS does not allow Content-Type");

console.log(
  JSON.stringify({
    ok: true,
    modelCount: models.data.length,
    missingAuthStatus: authResponse.status,
    directConnectionCors: true,
  }),
);
