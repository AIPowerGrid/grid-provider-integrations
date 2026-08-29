#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  GridStarterClient,
  maxCostUsd,
  mediaReceipt,
  preflight,
  printJson,
  requireText,
  sha256,
} from "../lib/grid-client.mjs";

const HELP = `Usage: NFT_NAME='...' NFT_PROMPT='...' node starters/nft-media-workflow/index.mjs

Environment:
  AIPG_API_KEY       scoped Grid key (required)
  NFT_NAME           metadata name (required)
  NFT_PROMPT         image prompt (required)
  NFT_DESCRIPTION    optional public description
  NFT_OUTPUT_DIR     default: ./aipg-nft-output
  AIPG_IMAGE_MODEL   default: Krea 2 Turbo
  AIPG_MAX_COST_USD  hard request ceiling, default: 0.02`;

export async function runNftWorkflow({ environment = process.env, client, write = true } = {}) {
  const name = requireText(environment.NFT_NAME, "NFT_NAME", 160);
  const prompt = requireText(environment.NFT_PROMPT, "NFT_PROMPT", 2_000);
  const description = requireText(
    environment.NFT_DESCRIPTION ?? `Generated for ${name} through AI Power Grid.`,
    "NFT_DESCRIPTION",
    1_000,
  );
  const model = environment.AIPG_IMAGE_MODEL || "Krea 2 Turbo";
  const api = client ?? new GridStarterClient();
  const price = await preflight(api, {
    model,
    modality: "image",
    prompt_tokens: 0,
    max_tokens: 0,
    n: 1,
  }, maxCostUsd(environment));
  const response = await api.image({ model, prompt, size: "1024x1024" });
  const media = mediaReceipt(response);
  const metadata = {
    name,
    description,
    image: media.url,
    attributes: [
      { trait_type: "Generator", value: "AI Power Grid" },
      { trait_type: "Model", value: media.model ?? model },
      ...(media.seed === undefined ? [] : [{ trait_type: "Seed", value: String(media.seed) }]),
    ],
    aipg: {
      schema: "aipg.media-receipt.v1",
      jobId: media.jobId,
      promptHash: sha256(prompt),
      onchainAnchorVerified: false,
    },
  };
  let outputPath;
  if (write) {
    const outputDirectory = path.resolve(environment.NFT_OUTPUT_DIR || "aipg-nft-output");
    await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
    outputPath = path.join(outputDirectory, "metadata.json");
    await writeFile(outputPath, `${JSON.stringify(metadata, null, 2)}\n`, { mode: 0o600 });
  }
  return {
    outputPath,
    metadata,
    quotedCostUsd: price.costUsd,
    chargingEnabled: price.chargingEnabled,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(`${HELP}\n`);
  } else {
    runNftWorkflow()
      .then((result) => printJson(result))
      .catch((error) => {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
      });
  }
}
