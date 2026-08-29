/** ElizaOS model handlers backed by AI Power Grid. */

import type {
  GenerateTextParams,
  IAgentRuntime,
  ImageGenerationParams,
  Plugin,
  TextStreamResult,
} from "@elizaos/core";
import { ModelType } from "@elizaos/core";
import type { AipgTextRequest } from "./client.js";
import { clientFor, setting } from "./runtime.js";

interface ImageGenerationResult {
  url: string;
}

function textRequest(
  runtime: IAgentRuntime,
  params: GenerateTextParams,
  modelSetting: string,
  fallbackModel: string,
): AipgTextRequest {
  return {
    model: setting(runtime, modelSetting) ?? fallbackModel,
    prompt: params.prompt,
    maxTokens: params.maxTokens,
    temperature: params.temperature,
    topP: params.topP,
    frequencyPenalty: params.frequencyPenalty,
    presencePenalty: params.presencePenalty,
    stop: params.stopSequences,
    seed: params.seed,
  };
}

async function generateText(
  runtime: IAgentRuntime,
  params: GenerateTextParams,
  modelSetting: string,
  fallbackModel: string,
): Promise<string | TextStreamResult> {
  const client = clientFor(runtime);
  const request = textRequest(runtime, params, modelSetting, fallbackModel);
  if (params.stream || params.onStreamChunk) {
    return client.streamText(request, params.onStreamChunk) as TextStreamResult;
  }
  return (await client.completeText(request)).text;
}

async function generateImage(
  runtime: IAgentRuntime,
  params: ImageGenerationParams,
): Promise<ImageGenerationResult[]> {
  const model = setting(runtime, "AIPG_IMAGE_MODEL");
  if (!model) {
    throw new Error(
      "AIPG_IMAGE_MODEL is required for ElizaOS IMAGE calls; select an online image model.",
    );
  }
  const client = clientFor(runtime);
  const online = await client.modelStatus();
  if (!online.some((entry) => entry.name === model && entry.type === "image" && entry.count > 0)) {
    throw new Error(`AIPG_IMAGE_MODEL '${model}' is not an online image model.`);
  }
  const result = await client.generateImage({
    model,
    prompt: params.prompt,
    size: params.size,
    n: params.count,
  });
  const images = result.data.flatMap((item) => (item.url ? [{ url: item.url }] : []));
  if (images.length === 0) throw new Error("Grid returned no image URL");
  return images;
}

export const aipgModels: NonNullable<Plugin["models"]> = {
  [ModelType.TEXT_SMALL]: (runtime, params) =>
    generateText(runtime, params, "AIPG_TEXT_SMALL_MODEL", "auto"),
  [ModelType.TEXT_LARGE]: (runtime, params) =>
    generateText(runtime, params, "AIPG_TEXT_LARGE_MODEL", "auto"),
  [ModelType.TEXT_REASONING_SMALL]: (runtime, params) =>
    generateText(runtime, params, "AIPG_REASONING_MODEL", "auto"),
  [ModelType.TEXT_REASONING_LARGE]: (runtime, params) =>
    generateText(runtime, params, "AIPG_REASONING_MODEL", "auto"),
  [ModelType.TEXT_COMPLETION]: (runtime, params) =>
    generateText(runtime, params, "AIPG_COMPLETION_MODEL", "auto"),
  [ModelType.IMAGE]: generateImage,
};
