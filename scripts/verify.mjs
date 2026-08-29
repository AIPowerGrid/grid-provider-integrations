#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [
  ["root tests", "npm", ["test"], "."],
  ["root syntax", "npm", ["run", "check"], "."],
  ["Open WebUI", "node", ["scripts/check-public.mjs"], "open-webui-aipg"],
  ["Vercel AI SDK tests", "npm", ["test"], "ai-sdk-aipg"],
  ["Vercel AI SDK types", "npm", ["run", "typecheck"], "ai-sdk-aipg"],
  ["Vercel AI SDK lint", "npm", ["run", "lint"], "ai-sdk-aipg"],
  ["Vercel AI SDK build", "npm", ["run", "build"], "ai-sdk-aipg"],
  ["ElizaOS tests", "bun", ["run", "test"], "elizaos-aipg"],
  ["ElizaOS types", "bun", ["run", "typecheck"], "elizaos-aipg"],
  ["ElizaOS lint", "bun", ["run", "lint"], "elizaos-aipg"],
  ["ElizaOS build", "bun", ["run", "build"], "elizaos-aipg"],
  ["ElizaOS package", "npm", ["publish", "--dry-run", "--access", "public"], "elizaos-aipg"],
  ["Dify tests", "uv", ["run", "pytest"], "dify-aipg", { UV_CACHE_DIR: "/tmp/aipg-dify-uv" }],
  ["Dify lint", "uv", ["run", "ruff", "check", "."], "dify-aipg", { UV_CACHE_DIR: "/tmp/aipg-dify-uv" }],
  ["Dify catalog", "uv", ["run", "python", "scripts/check_catalog.py"], "dify-aipg", { UV_CACHE_DIR: "/tmp/aipg-dify-uv" }],
  ["LangChain tests", "uv", ["run", "pytest"], "langchain-aipg", { UV_CACHE_DIR: "/tmp/aipg-langchain-uv-cache" }],
  ["LangChain lint", "uv", ["run", "ruff", "check", "."], "langchain-aipg", { UV_CACHE_DIR: "/tmp/aipg-langchain-uv-cache" }],
  ["n8n lint", "npm", ["run", "lint"], "n8n-nodes-aipg"],
  ["n8n tests", "npm", ["test"], "n8n-nodes-aipg"],
];

for (const [label, command, args, directory, environment = {}] of checks) {
  process.stdout.write(`\n== ${label} ==\n`);
  const result = spawnSync(command, args, {
    cwd: path.join(root, directory),
    env: { ...process.env, ...environment },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

process.stdout.write("\nAll local integration checks passed.\n");
