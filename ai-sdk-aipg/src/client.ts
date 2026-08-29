import type {
  AipgCredits,
  AipgModelStatus,
  AipgMusicOptions,
  AipgMusicResult,
  AipgProviderSettings,
  AipgQuote,
  AipgQuoteOptions,
  AipgTextModel,
} from "./types.js";

export const AIPG_BASE_URL = "https://api.aipowergrid.io/v1";

export class AipgApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "AIPG_API_ERROR") {
    super(message);
    this.name = "AipgApiError";
    this.status = status;
    this.code = code;
  }
}

function bounded(value: string, max = 400): string {
  const oneLine = value.replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}...`;
}

function normalizedBaseURL(value: string): string {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !local) {
    throw new Error("AIPG baseURL must use HTTPS unless it is loopback-local");
  }
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/+$/, "");
}

async function errorFrom(response: Response): Promise<AipgApiError> {
  let message = `${response.status} ${response.statusText}`.trim();
  const raw = await response.text().catch(() => "");
  try {
    const body = JSON.parse(raw) as Record<string, unknown>;
    const detail = body.detail ?? body.error;
    if (typeof detail === "string") message = detail;
    else if (detail && typeof detail === "object") {
      const inner = detail as Record<string, unknown>;
      if (typeof inner.message === "string") message = inner.message;
    }
  } catch {
    if (raw) message = raw;
  }
  return new AipgApiError(bounded(message), response.status);
}

export class AipgClient {
  readonly baseURL: string;
  readonly apiKey: string;
  readonly headers: Record<string, string>;
  readonly fetchImpl: typeof globalThis.fetch;
  readonly timeoutMs: number;

  constructor(settings: AipgProviderSettings) {
    const environmentKey = typeof process !== "undefined" ? process.env?.AIPG_API_KEY : undefined;
    const apiKey = settings.apiKey ?? environmentKey ?? "";
    if (!apiKey.trim()) throw new Error("AIPG_API_KEY is required");
    if (
      Object.keys(settings.headers ?? {}).some((name) => name.toLowerCase() === "authorization")
    ) {
      throw new Error("Set the Grid credential with apiKey, not an Authorization header");
    }
    this.apiKey = apiKey;
    this.baseURL = normalizedBaseURL(settings.baseURL ?? AIPG_BASE_URL);
    this.headers = { ...settings.headers };
    this.fetchImpl = settings.fetch ?? globalThis.fetch;
    this.timeoutMs = settings.timeoutMs ?? 2_100_000;
  }

  async request<T>(path: string, init: RequestInit = {}, timeoutMs = this.timeoutMs): Promise<T> {
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    const response = await this.fetchImpl(`${this.baseURL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...this.headers,
        ...init.headers,
      },
      redirect: "error",
      signal,
    });
    if (!response.ok) throw await errorFrom(response);
    return (await response.json()) as T;
  }

  modelStatus(): Promise<AipgModelStatus[]> {
    return this.request<AipgModelStatus[]>("/status/models", {}, 20_000);
  }

  async textModels(): Promise<AipgTextModel[]> {
    const response = await this.request<{ data?: AipgTextModel[] }>("/models", {}, 20_000);
    return response.data ?? [];
  }

  credits(): Promise<AipgCredits> {
    return this.request<AipgCredits>("/account/credits", {}, 20_000);
  }

  quote(options: AipgQuoteOptions): Promise<AipgQuote> {
    return this.request<AipgQuote>("/account/credits/quote", {
      method: "POST",
      body: JSON.stringify({
        model: options.model,
        modality: options.modality,
        prompt_tokens: options.promptTokens ?? 0,
        max_tokens: options.maxTokens ?? 0,
        n: options.n ?? 1,
        seconds: options.seconds,
      }),
    });
  }

  async assertOnline(model: string, type: "image" | "video" | "audio"): Promise<AipgModelStatus> {
    const online = await this.modelStatus();
    const entry = online.find(
      (candidate) => candidate.name === model && candidate.type === type && candidate.count > 0,
    );
    if (!entry) {
      throw new AipgApiError(`AIPG model '${model}' is not online for ${type} generation`, 503);
    }
    return entry;
  }

  assertCapability(status: AipgModelStatus, capability: string): void {
    if (status.capabilities && !status.capabilities.includes(capability)) {
      throw new AipgApiError(
        `AIPG model '${status.name}' does not advertise the '${capability}' capability`,
        400,
      );
    }
  }

  async generateMusic(options: AipgMusicOptions): Promise<AipgMusicResult> {
    const model = options.model ?? "ace-step-v1.5-xl-turbo";
    await this.assertOnline(model, "audio");
    const response = await this.request<{
      created?: number;
      data?: Array<{ url?: string; seed?: number }>;
      grid?: Record<string, unknown>;
    }>("/audio/generations", {
      method: "POST",
      signal: options.abortSignal,
      body: JSON.stringify({
        model,
        prompt: options.prompt,
        lyrics: options.lyrics ?? "",
        seconds: options.seconds,
        inference_steps: options.inferenceSteps,
        bpm: options.bpm,
        key_scale: options.keyScale,
        time_signature: options.timeSignature,
        vocal_language: options.vocalLanguage,
        seed: options.seed,
      }),
    });
    const item = response.data?.[0];
    if (!item?.url) throw new AipgApiError("Grid returned no music URL", 502);
    return { url: item.url, seed: item.seed, created: response.created, grid: response.grid };
  }
}

export function fileToDataURI(file: {
  type: "file";
  mediaType: string;
  data: string | Uint8Array;
}): string {
  let data: string;
  if (typeof file.data === "string") {
    data = file.data;
  } else {
    let binary = "";
    for (const byte of file.data) binary += String.fromCharCode(byte);
    data = btoa(binary);
  }
  if (data.startsWith("data:")) return data;
  return `data:${file.mediaType};base64,${data}`;
}

export function definedHeaders(
  headers: Record<string, string | undefined> | undefined,
): Record<string, string> | undefined {
  if (!headers) return undefined;
  return Object.fromEntries(
    Object.entries(headers).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}

export function responseHeaders(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

export function imageMediaType(outputFormat?: string): string {
  if (outputFormat === "jpeg") return "image/jpeg";
  if (outputFormat === "png") return "image/png";
  return "image/webp";
}
