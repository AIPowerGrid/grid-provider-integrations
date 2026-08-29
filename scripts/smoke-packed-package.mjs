#!/usr/bin/env node
import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targets = {
  "ai-sdk-aipg": {
    peers(packageJson) {
      return [`ai@${packageJson.devDependencies.ai}`];
    },
    smoke: `
      import assert from "node:assert/strict";
      import { AIPG_BASE_URL, createAipg } from "@aipowergrid/ai-sdk-provider";

      assert.equal(AIPG_BASE_URL, "https://api.aipowergrid.io/v1");
      const provider = createAipg({ apiKey: "grid_packaged_consumer_fixture" });
      const model = provider.languageModel("auto");
      assert.equal(model.specificationVersion, "v4");
      assert.equal(model.modelId, "auto");
      assert.equal(typeof provider.imageModel, "function");
      assert.equal(typeof provider.videoModel, "function");
      assert.equal(typeof provider.generateMusic, "function");
    `,
  },
  "elizaos-aipg": {
    peers(packageJson) {
      return [`@elizaos/core@${packageJson.peerDependencies["@elizaos/core"]}`];
    },
    smoke: `
      import assert from "node:assert/strict";
      import aipgPlugin, { AIPG_BASE_URL, aipgActions, aipgModels } from "@aipowergrid/plugin-aipg";

      assert.equal(AIPG_BASE_URL, "https://api.aipowergrid.io/v1");
      assert.equal(aipgPlugin.name, "aipg");
      assert.equal(aipgPlugin.actions, aipgActions);
      assert.equal(aipgPlugin.models, aipgModels);
      assert.deepEqual(
        aipgActions.map((action) => action.name),
        ["AIPG_CHAT", "AIPG_GENERATE_IMAGE", "AIPG_GENERATE_VIDEO", "AIPG_GENERATE_AUDIO", "AIPG_LIST_MODELS", "AIPG_CREDIT_STATUS"],
      );
    `,
  },
};

const targetName = process.argv[2];
const target = targets[targetName];
if (!target) throw new Error(`Expected one package target: ${Object.keys(targets).join(", ")}`);

const packageDirectory = join(root, targetName);
const packageJson = JSON.parse(await readFile(join(packageDirectory, "package.json"), "utf8"));
const workspace = await mkdtemp(join(tmpdir(), `aipg-${targetName}-consumer-`));

try {
  const packed = await execFile(
    "npm",
    ["pack", "--ignore-scripts", "--json", "--pack-destination", workspace],
    {
      cwd: packageDirectory,
      maxBuffer: 5_000_000,
    },
  );
  const packageResult = JSON.parse(packed.stdout);
  if (!Array.isArray(packageResult) || packageResult.length !== 1 || !packageResult[0].filename) {
    throw new Error(`npm pack returned an unexpected result for ${targetName}`);
  }

  const consumer = join(workspace, "consumer");
  await mkdir(consumer);
  await writeFile(join(consumer, "package.json"), '{"private":true,"type":"module"}\n', "utf8");
  await execFile(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      join(workspace, packageResult[0].filename),
      ...target.peers(packageJson),
    ],
    { cwd: consumer, maxBuffer: 10_000_000 },
  );
  await writeFile(join(consumer, "smoke.mjs"), target.smoke, "utf8");
  await execFile(process.execPath, ["smoke.mjs"], { cwd: consumer, maxBuffer: 5_000_000 });
  process.stdout.write(`Packed consumer smoke passed for ${packageJson.name}@${packageJson.version}\n`);
} finally {
  await rm(workspace, { recursive: true, force: true });
}
