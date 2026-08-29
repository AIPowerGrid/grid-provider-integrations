#!/usr/bin/env node

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

const HELP = `Usage: DAO_PROPOSAL='...' node starters/dao-media-pipeline/index.mjs

Environment:
  AIPG_API_KEY       scoped Grid key (required)
  DAO_PROPOSAL       proposal title or summary (required)
  DAO_NAME           default: Community DAO
  DAO_MEDIA_TYPE     image | video | audio, default: image
  AIPG_MEDIA_MODEL   optional model override
  AIPG_IMAGE_SIZE    default: 1024x1024
  DAO_MEDIA_SECONDS  default: 4 video, 30 audio
  AIPG_MAX_COST_USD  hard request ceiling, default: 0.02`;

export async function runDaoMedia({ environment = process.env, client } = {}) {
  const proposal = requireText(environment.DAO_PROPOSAL, "DAO_PROPOSAL", 2_000);
  const dao = requireText(environment.DAO_NAME ?? "Community DAO", "DAO_NAME", 120);
  const mediaType = environment.DAO_MEDIA_TYPE || "image";
  if (!["image", "video", "audio"].includes(mediaType)) {
    throw new Error("DAO_MEDIA_TYPE must be image, video, or audio");
  }
  const defaultModels = {
    image: "Krea 2 Turbo",
    video: "LTX Director 2.0",
    audio: "ace-step-v1.5-xl-turbo",
  };
  const model = environment.AIPG_MEDIA_MODEL || environment.AIPG_IMAGE_MODEL || defaultModels[mediaType];
  const size = environment.AIPG_IMAGE_SIZE || "1024x1024";
  const seconds = Number(environment.DAO_MEDIA_SECONDS ?? (mediaType === "audio" ? 30 : 4));
  if (["video", "audio"].includes(mediaType) && (!Number.isFinite(seconds) || seconds <= 0)) {
    throw new Error("DAO_MEDIA_SECONDS must be greater than zero");
  }
  const api = client ?? new GridStarterClient();
  const medium = mediaType === "audio" ? "instrumental score" : `${mediaType} artwork`;
  const prompt = [
    `Editorial governance ${medium} for ${dao}.`,
    `Proposal: ${proposal}.`,
    mediaType === "audio"
      ? "Hopeful, focused, modern, no vocals, no token-price themes."
      : "Clear central subject, strong readable composition, no logos, no text, no token-price imagery.",
  ].join(" ");
  const price = await preflight(api, {
    model,
    modality: mediaType,
    prompt_tokens: 0,
    max_tokens: 0,
    n: 1,
    ...(["video", "audio"].includes(mediaType) ? { seconds } : {}),
  }, maxCostUsd(environment));
  let response;
  if (mediaType === "video") response = await api.video({ model, prompt, seconds });
  else if (mediaType === "audio") response = await api.audio({ model, prompt, seconds });
  else response = await api.image({ model, prompt, size });
  const media = mediaReceipt(response);
  return {
    schema: "aipg.dao-media-artifact.v1",
    dao,
    proposalHash: sha256(proposal),
    mediaType,
    mediaUrl: media.url,
    seed: media.seed,
    grid: {
      jobId: media.jobId,
      model: media.model ?? model,
      onchainAnchorVerified: false,
    },
    quotedCostUsd: price.costUsd,
    chargingEnabled: price.chargingEnabled,
    createdAt: new Date().toISOString(),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(`${HELP}\n`);
  } else {
    runDaoMedia()
      .then((result) => printJson(result))
      .catch((error) => {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
      });
  }
}
