/** Explicit ElizaOS actions for Grid generation and read-only account status. */

import type {
  Action,
  ActionResult,
  HandlerCallback,
  HandlerOptions,
  IAgentRuntime,
  Memory,
} from "@elizaos/core";
import type { AipgClient } from "./client.js";
import { apiKey, clientFor } from "./runtime.js";

type Parameters = Record<string, unknown>;

function parameters(options?: HandlerOptions): Parameters {
  if (!options || typeof options !== "object") return {};
  const nested = (options as Record<string, unknown>).parameters;
  return nested && typeof nested === "object" && !Array.isArray(nested)
    ? (nested as Parameters)
    : (options as Parameters);
}

function textParam(params: Parameters, name: string, required = false): string | undefined {
  const value = params[name];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (required) throw new Error(`${name} is required`);
  return undefined;
}

function numberParam(params: Parameters, name: string): number | undefined {
  const value = params[name];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function firstUrl(data: Array<{ url?: string }>, kind: string): string {
  const url = data.find((item) => typeof item.url === "string")?.url;
  if (!url) throw new Error(`Grid returned no ${kind} URL`);
  return url;
}

async function assertOnlineModel(
  client: AipgClient,
  model: string,
  modality: "text" | "image" | "video" | "audio",
  requiredCapability?: string,
): Promise<void> {
  if (modality === "text" && model === "auto") return;
  const models = await client.modelStatus();
  const match = models.find(
    (entry) => entry.name === model && entry.type === modality && entry.count > 0,
  );
  if (!match) {
    const online = models
      .filter((entry) => entry.type === modality && entry.count > 0)
      .map((entry) => entry.name);
    throw new Error(
      `Grid ${modality} model '${model}' is not online. Available: ${online.join(", ") || "none"}`,
    );
  }
  if (requiredCapability && !match.capabilities?.includes(requiredCapability)) {
    throw new Error(`Grid ${modality} model '${model}' does not advertise ${requiredCapability}.`);
  }
}

function failure(error: unknown): ActionResult {
  const message = error instanceof Error ? error.message : "Unknown Grid error";
  return {
    success: false,
    text: `AI Power Grid request failed: ${message}`,
    error: message,
    data: { provider: "aipg", error: message },
  };
}

async function deliver(
  callback: HandlerCallback | undefined,
  text: string,
  url?: string,
): Promise<void> {
  await callback?.({
    text,
    ...(url
      ? {
          attachments: [
            {
              id: crypto.randomUUID(),
              url,
              title: "AI Power Grid generation",
              source: "aipg",
            },
          ],
        }
      : {}),
  });
}

function configured(runtime: IAgentRuntime): Promise<boolean> {
  return Promise.resolve(Boolean(apiKey(runtime)));
}

export const chatAction: Action = {
  name: "AIPG_CHAT",
  similes: ["ASK_AIPG", "GRID_CHAT", "AIPG_TEXT"],
  description:
    "Generate a bounded text answer with an online AI Power Grid model. Requires prompt; model defaults to auto.",
  parameters: [
    {
      name: "prompt",
      description: "The complete prompt.",
      required: true,
      schema: { type: "string" },
    },
    {
      name: "model",
      description: "Online Grid text model id.",
      required: false,
      schema: { type: "string" },
    },
    {
      name: "max_tokens",
      description: "Maximum output tokens, from 1 to 32768.",
      required: false,
      schema: { type: "number", minimum: 1, maximum: 32768 },
    },
  ],
  validate: configured,
  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state,
    options?: HandlerOptions,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    try {
      const params = parameters(options);
      const client = clientFor(runtime);
      const model = textParam(params, "model") ?? "auto";
      await assertOnlineModel(client, model, "text");
      const result = await client.completeText({
        prompt: textParam(params, "prompt", true) as string,
        model,
        maxTokens: Math.max(1, Math.min(32_768, numberParam(params, "max_tokens") ?? 2048)),
      });
      await deliver(callback, result.text);
      return {
        success: true,
        text: result.text,
        data: {
          provider: "aipg",
          model,
          finishReason: result.finishReason ?? "unknown",
        },
      };
    } catch (error) {
      return failure(error);
    }
  },
};

export const imageAction: Action = {
  name: "AIPG_GENERATE_IMAGE",
  similes: ["GRID_IMAGE", "CREATE_AIPG_IMAGE"],
  description:
    "Generate an image on AI Power Grid. Requires a prompt and an online image model id.",
  parameters: [
    { name: "prompt", description: "Image prompt.", required: true, schema: { type: "string" } },
    {
      name: "model",
      description: "Online Grid image model id.",
      required: true,
      schema: { type: "string" },
    },
    {
      name: "size",
      description: "Output size such as 1024x1024.",
      required: false,
      schema: { type: "string" },
    },
  ],
  validate: configured,
  handler: async (runtime, _message, _state, options, callback): Promise<ActionResult> => {
    try {
      const params = parameters(options);
      const model = textParam(params, "model", true) as string;
      const image = textParam(params, "image");
      const client = clientFor(runtime);
      await assertOnlineModel(client, model, "image", image ? "img2img" : "txt2img");
      const result = await client.generateImage({
        prompt: textParam(params, "prompt", true) as string,
        model,
        size: textParam(params, "size"),
        seed: numberParam(params, "seed"),
        image,
        negativePrompt: textParam(params, "negative_prompt"),
      });
      const url = firstUrl(result.data, "image");
      const text = `Generated an image with ${model}: ${url}`;
      await deliver(callback, text, url);
      return { success: true, text, data: { provider: "aipg", model, url, mediaType: "image" } };
    } catch (error) {
      return failure(error);
    }
  },
};

export const videoAction: Action = {
  name: "AIPG_GENERATE_VIDEO",
  similes: ["GRID_VIDEO", "CREATE_AIPG_VIDEO"],
  description: "Generate a video on AI Power Grid. Requires a prompt and an online video model id.",
  parameters: [
    { name: "prompt", description: "Video prompt.", required: true, schema: { type: "string" } },
    {
      name: "model",
      description: "Online Grid video model id.",
      required: true,
      schema: { type: "string" },
    },
    {
      name: "seconds",
      description: "Duration from 1 to 10 seconds.",
      required: false,
      schema: { type: "number", minimum: 1, maximum: 10 },
    },
  ],
  validate: configured,
  handler: async (runtime, _message, _state, options, callback): Promise<ActionResult> => {
    try {
      const params = parameters(options);
      const model = textParam(params, "model", true) as string;
      const image = textParam(params, "image");
      const client = clientFor(runtime);
      await assertOnlineModel(client, model, "video", image ? "img2video" : "txt2video");
      const result = await client.generateVideo({
        prompt: textParam(params, "prompt", true) as string,
        model,
        size: textParam(params, "size"),
        seconds: numberParam(params, "seconds"),
        fps: numberParam(params, "fps"),
        seed: numberParam(params, "seed"),
        image,
      });
      const url = firstUrl(result.data, "video");
      const text = `Generated a video with ${model}: ${url}`;
      await deliver(callback, text, url);
      return { success: true, text, data: { provider: "aipg", model, url, mediaType: "video" } };
    } catch (error) {
      return failure(error);
    }
  },
};

export const audioAction: Action = {
  name: "AIPG_GENERATE_AUDIO",
  similes: ["GRID_AUDIO", "AIPG_MUSIC", "CREATE_AIPG_MUSIC"],
  description:
    "Generate a music track on AI Power Grid. Requires a style prompt and an online audio model id; lyrics are optional.",
  parameters: [
    {
      name: "prompt",
      description: "Music style and arrangement prompt.",
      required: true,
      schema: { type: "string" },
    },
    {
      name: "model",
      description: "Online Grid audio model id.",
      required: true,
      schema: { type: "string" },
    },
    {
      name: "lyrics",
      description: "Optional song lyrics.",
      required: false,
      schema: { type: "string" },
    },
    {
      name: "seconds",
      description: "Duration from 10 to 300 seconds.",
      required: false,
      schema: { type: "number", minimum: 10, maximum: 300 },
    },
  ],
  validate: configured,
  handler: async (runtime, _message, _state, options, callback): Promise<ActionResult> => {
    try {
      const params = parameters(options);
      const model = textParam(params, "model", true) as string;
      const client = clientFor(runtime);
      await assertOnlineModel(client, model, "audio");
      const timeSignature = textParam(params, "time_signature");
      if (timeSignature && !["2/4", "3/4", "4/4", "6/8"].includes(timeSignature)) {
        throw new Error("time_signature must be one of 2/4, 3/4, 4/4, or 6/8");
      }
      const result = await client.generateAudio({
        prompt: textParam(params, "prompt", true) as string,
        model,
        lyrics: textParam(params, "lyrics"),
        seconds: numberParam(params, "seconds"),
        bpm: numberParam(params, "bpm"),
        keyScale: textParam(params, "key_scale"),
        timeSignature: timeSignature as "2/4" | "3/4" | "4/4" | "6/8" | undefined,
        vocalLanguage: textParam(params, "vocal_language"),
        seed: numberParam(params, "seed"),
      });
      const url = firstUrl(result.data, "audio");
      const text = `Generated a music track with ${model}: ${url}`;
      await deliver(callback, text, url);
      return { success: true, text, data: { provider: "aipg", model, url, mediaType: "audio" } };
    } catch (error) {
      return failure(error);
    }
  },
};

export const listModelsAction: Action = {
  name: "AIPG_LIST_MODELS",
  similes: ["GRID_MODELS", "AIPG_MODELS"],
  description: "List AI Power Grid models with a compatible worker online right now.",
  validate: configured,
  handler: async (runtime, _message, _state, _options, callback): Promise<ActionResult> => {
    try {
      const models = await clientFor(runtime).modelStatus();
      const text =
        models.length > 0
          ? `Online Grid models:\n${models
              .map(
                (model) =>
                  `${model.name} (${model.type}, ${model.count} worker${model.count === 1 ? "" : "s"}${
                    model.capabilities?.length ? `; ${model.capabilities.join(", ")}` : ""
                  })`,
              )
              .join("\n")}`
          : "No Grid models are currently online.";
      await deliver(callback, text);
      return { success: true, text, data: { provider: "aipg", models } };
    } catch (error) {
      return failure(error);
    }
  },
};

export const creditStatusAction: Action = {
  name: "AIPG_CREDIT_STATUS",
  similes: ["GRID_CREDITS", "AIPG_BALANCE"],
  description:
    "Read the Grid account's spendable credit total and charging status without spending.",
  validate: configured,
  handler: async (runtime, _message, _state, _options, callback): Promise<ActionResult> => {
    try {
      const credits = await clientFor(runtime).credits();
      const text = `Grid spendable credits: $${credits.total_spendable_usd.toFixed(4)}. Charging is ${credits.charging_enabled ? "enabled" : "disabled"}.`;
      await deliver(callback, text);
      return {
        success: true,
        text,
        data: {
          provider: "aipg",
          totalSpendableUsd: credits.total_spendable_usd,
          chargingEnabled: credits.charging_enabled,
        },
      };
    } catch (error) {
      return failure(error);
    }
  },
};

export const aipgActions = [
  chatAction,
  imageAction,
  videoAction,
  audioAction,
  listModelsAction,
  creditStatusAction,
];
