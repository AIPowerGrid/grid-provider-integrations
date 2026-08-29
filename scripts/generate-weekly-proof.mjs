#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { generateWeeklyProof } from "../src/weekly-proof.mjs";

function valueAfter(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`${name} requires a value`);
  return args[index + 1];
}

const args = process.argv.slice(2);
const known = new Set(["--base-url", "--output"]);
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (!known.has(arg)) throw new Error(`Unknown option: ${arg}`);
  index += 1;
}

const markdown = await generateWeeklyProof({ baseUrl: valueAfter(args, "--base-url") });
const output = valueAfter(args, "--output");
if (output) {
  await writeFile(output, markdown, "utf8");
  process.stdout.write(`Wrote ${output}\n`);
} else {
  process.stdout.write(markdown);
}
