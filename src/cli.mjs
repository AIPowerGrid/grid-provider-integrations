#!/usr/bin/env node
import { runConformance } from "./aipg-conformance.mjs";

function valueAfter(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`${name} requires a value`);
  return args[index + 1];
}

const args = process.argv.slice(2);
const known = new Set(["--account", "--live-text", "--base-url", "--key-env", "--model"]);
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (!known.has(arg)) throw new Error(`Unknown option: ${arg}`);
  if (["--base-url", "--key-env", "--model"].includes(arg)) index += 1;
}

const keyEnv = valueAfter(args, "--key-env") || "GRID_API_KEY";
const wantsKey = args.includes("--account") || args.includes("--live-text");
const report = await runConformance({
  baseUrl: valueAfter(args, "--base-url"),
  apiKey: wantsKey ? process.env[keyEnv] : undefined,
  account: args.includes("--account"),
  liveText: args.includes("--live-text"),
  model: valueAfter(args, "--model"),
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 1;
