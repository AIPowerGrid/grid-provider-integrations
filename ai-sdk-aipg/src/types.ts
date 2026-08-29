export type AipgTextModelId =
  | "auto"
  | "Smollm-135m"
  | "gpt-oss-120b"
  | "deepseek-v4-flash-nvfp4"
  | (string & {});

export interface AipgTextModel {
  id: string;
  object: "model" | string;
  owned_by?: string;
  input_modalities?: string[];
}

export type AipgImageModelId =
  | "Krea 2 Turbo"
  | "z-image-turbo"
  | "FLUX.2 Klein 4B FP8"
  | (string & {});

export type AipgVideoModelId = "LTX Director 2.0" | "LTX-2.3" | "LTX-2.3 Audio" | (string & {});

export type AipgMusicModelId = "ace-step-v1.5-xl-turbo" | (string & {});

export interface AipgModelStatus {
  name: string;
  count: number;
  type: "text" | "image" | "video" | "audio" | string;
  capabilities?: string[] | null;
  max_context_length?: number | null;
}

export interface AipgCredits {
  total_spendable_micro: number;
  total_spendable_usd: number;
  charging_enabled: boolean;
  charging_mode: string;
  [key: string]: unknown;
}

export interface AipgQuoteOptions {
  model: string;
  modality: "text" | "image" | "video" | "audio";
  promptTokens?: number;
  maxTokens?: number;
  n?: number;
  seconds?: number;
}

export interface AipgQuote {
  model: string;
  modality: string;
  priced: boolean;
  cost_micro: number;
  cost_usd: number;
  charging_enabled: boolean;
  [key: string]: unknown;
}

export interface AipgMusicOptions {
  model?: AipgMusicModelId;
  prompt: string;
  lyrics?: string;
  seconds?: number;
  inferenceSteps?: number;
  bpm?: number;
  keyScale?: string;
  timeSignature?: "2/4" | "3/4" | "4/4" | "6/8";
  vocalLanguage?: string;
  seed?: number;
  abortSignal?: AbortSignal;
}

export interface AipgMusicResult {
  url: string;
  seed?: number;
  created?: number;
  grid?: Record<string, unknown>;
}

export interface AipgImageProviderOptions {
  negativePrompt?: string;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  scheduler?: string;
  strength?: number;
  outputFormat?: "png" | "jpeg" | "webp";
}

export interface AipgVideoProviderOptions {
  negativePrompt?: string;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  scheduler?: string;
}

export interface AipgProviderSettings {
  apiKey?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}
