import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { Experimental_VideoModelV4, ImageModelV4, LanguageModelV4 } from "@ai-sdk/provider";
import { AipgClient } from "./client.js";
import { AipgImageModel } from "./image-model.js";
import type {
  AipgCredits,
  AipgImageModelId,
  AipgModelStatus,
  AipgMusicModelId,
  AipgMusicOptions,
  AipgMusicResult,
  AipgProviderSettings,
  AipgQuote,
  AipgQuoteOptions,
  AipgTextModel,
  AipgTextModelId,
  AipgVideoModelId,
} from "./types.js";
import { AipgVideoModel } from "./video-model.js";

export interface AipgProvider {
  (modelId: AipgTextModelId): LanguageModelV4;
  languageModel(modelId: AipgTextModelId): LanguageModelV4;
  chatModel(modelId: AipgTextModelId): LanguageModelV4;
  imageModel(modelId: AipgImageModelId): ImageModelV4;
  videoModel(modelId: AipgVideoModelId): Experimental_VideoModelV4;
  listOnlineModels(): Promise<AipgModelStatus[]>;
  listTextModels(): Promise<AipgTextModel[]>;
  credits(): Promise<AipgCredits>;
  quote(options: AipgQuoteOptions): Promise<AipgQuote>;
  generateMusic(options: AipgMusicOptions & { model?: AipgMusicModelId }): Promise<AipgMusicResult>;
}

export function createAipg(settings: AipgProviderSettings = {}): AipgProvider {
  const client = new AipgClient(settings);
  const text = createOpenAICompatible<AipgTextModelId, never, never, never>({
    name: "aipg",
    baseURL: client.baseURL,
    apiKey: client.apiKey,
    headers: client.headers,
    fetch: client.fetchImpl,
    includeUsage: true,
  });
  const provider = ((modelId: AipgTextModelId) => text(modelId)) as AipgProvider;
  provider.languageModel = (modelId) => text.languageModel(modelId);
  provider.chatModel = (modelId) => text.chatModel(modelId);
  provider.imageModel = (modelId) => new AipgImageModel(modelId, client);
  provider.videoModel = (modelId) => new AipgVideoModel(modelId, client);
  provider.listOnlineModels = () => client.modelStatus();
  provider.listTextModels = () => client.textModels();
  provider.credits = () => client.credits();
  provider.quote = (options) => client.quote(options);
  provider.generateMusic = (options) => client.generateMusic(options);
  return provider;
}

let defaultProvider: AipgProvider | undefined;

export const aipg = ((modelId: AipgTextModelId) => {
  defaultProvider ??= createAipg();
  return defaultProvider(modelId);
}) as AipgProvider;

for (const method of [
  "languageModel",
  "chatModel",
  "imageModel",
  "videoModel",
  "listOnlineModels",
  "listTextModels",
  "credits",
  "quote",
  "generateMusic",
] as const) {
  Object.defineProperty(aipg, method, {
    value: (...args: unknown[]) => {
      defaultProvider ??= createAipg();
      return (defaultProvider[method] as (...inner: unknown[]) => unknown)(...args);
    },
  });
}
