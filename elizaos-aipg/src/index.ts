/** AI Power Grid model and multimodal action plugin for ElizaOS. */

import type { Plugin } from "@elizaos/core";
import { aipgActions } from "./actions.js";
import { aipgModels } from "./models.js";

const env = typeof process === "undefined" ? {} : process.env;

export const aipgPlugin: Plugin = {
  name: "aipg",
  description:
    "AI Power Grid text, image, video, and music generation through remote community-operated workers.",
  config: {
    AIPG_API_KEY: env.AIPG_API_KEY ?? null,
    AIPG_TEXT_SMALL_MODEL: env.AIPG_TEXT_SMALL_MODEL ?? null,
    AIPG_TEXT_LARGE_MODEL: env.AIPG_TEXT_LARGE_MODEL ?? null,
    AIPG_REASONING_MODEL: env.AIPG_REASONING_MODEL ?? null,
    AIPG_COMPLETION_MODEL: env.AIPG_COMPLETION_MODEL ?? null,
    AIPG_IMAGE_MODEL: env.AIPG_IMAGE_MODEL ?? null,
  },
  models: aipgModels,
  actions: aipgActions,
};

export default aipgPlugin;
export * from "./actions.js";
export * from "./client.js";
export * from "./models.js";
