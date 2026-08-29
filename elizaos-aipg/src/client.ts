/**
 * Typed Grid `/v1` client used by the ElizaOS plugin.
 *
 * The public package intentionally owns this small fetch boundary so action
 * parameters can never redirect credentials to an arbitrary host.
 */

export const AIPG_BASE_URL = "https://api.aipowergrid.io/v1";

export interface AipgModel {
  id: string;
  object?: string;
  owned_by?: string;
}

export interface AipgModelStatus {
  name: string;
  count: number;
  type: "text" | "image" | "video" | "audio" | string;
  capabilities?: string[] | null;
  max_context_length?: number | null;
}

export interface AipgCredits {
  total_spendable_usd: number;
  charging_enabled: boolean;
  [key: string]: unknown;
}

export interface AipgUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AipgTextRequest {
  model: string;
  prompt: string;
  system?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  seed?: number;
}

export interface AipgTextResult {
  text: string;
  finishReason?: string;
  usage?: AipgUsage;
}

export interface AipgTextStream {
  textStream: AsyncIterable<string>;
  text: Promise<string>;
  usage: Promise<AipgUsage | undefined>;
  finishReason: Promise<string | undefined>;
}

export interface AipgMediaResult {
  created?: number;
  data: Array<{ url?: string; b64_json?: string; seed?: number }>;
  grid?: Record<string, unknown>;
}

export interface AipgImageRequest {
  prompt: string;
  model: string;
  size?: string;
  n?: number;
  image?: string;
  seed?: number;
  negativePrompt?: string;
}

export interface AipgVideoRequest {
  prompt: string;
  model: string;
  size?: string;
  seconds?: number;
  fps?: number;
  image?: string;
  seed?: number;
}

export interface AipgAudioRequest {
  prompt: string;
  model: string;
  lyrics?: string;
  seconds?: number;
  inferenceSteps?: number;
  bpm?: number;
  keyScale?: string;
  timeSignature?: "2/4" | "3/4" | "4/4" | "6/8";
  vocalLanguage?: string;
  seed?: number;
}

interface AipgClientOptions {
  apiKey: string;
  fetch?: typeof globalThis.fetch;
  baseUrl?: string;
}

interface StreamEvent {
  text?: string;
  finishReason?: string;
  usage?: AipgUsage;
  done?: boolean;
}

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

function bounded(value: string, max = 300): string {
  const oneLine = value.replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}...`;
}

function usageFrom(value: unknown): AipgUsage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const usage = value as Record<string, unknown>;
  const prompt = usage.prompt_tokens;
  const completion = usage.completion_tokens;
  const total = usage.total_tokens;
  if (typeof prompt !== "number" || typeof completion !== "number") return undefined;
  return {
    promptTokens: prompt,
    completionTokens: completion,
    totalTokens: typeof total === "number" ? total : prompt + completion,
  };
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

class TextQueue implements AsyncIterable<string> {
  private values: string[] = [];
  private waiters: Array<() => void> = [];
  private ended = false;
  private failure: unknown;

  push(value: string): void {
    this.values.push(value);
    this.wake();
  }

  end(): void {
    this.ended = true;
    this.wake();
  }

  fail(error: unknown): void {
    this.failure = error;
    this.ended = true;
    this.wake();
  }

  private wake(): void {
    for (const waiter of this.waiters.splice(0)) waiter();
  }

  async *[Symbol.asyncIterator](): AsyncIterator<string> {
    while (true) {
      while (this.values.length > 0) yield this.values.shift() as string;
      if (this.failure) throw this.failure;
      if (this.ended) return;
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
  }
}

export class AipgClient {
  private readonly apiKey: string;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly baseUrl: string;

  constructor(options: AipgClientOptions) {
    if (!options.apiKey.trim()) throw new Error("AIPG_API_KEY is required");
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.baseUrl = (options.baseUrl ?? AIPG_BASE_URL).replace(/\/+$/, "");
  }

  private async request(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const timeout = AbortSignal.timeout(timeoutMs);
    return this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    });
  }

  private async json<T>(path: string, init: RequestInit = {}, timeoutMs = 30_000): Promise<T> {
    const response = await this.request(path, init, timeoutMs);
    if (!response.ok) throw await this.error(response, path);
    try {
      return (await response.json()) as T;
    } catch {
      throw new AipgApiError(`Grid ${path} returned malformed JSON`, response.status);
    }
  }

  private async error(response: Response, path: string): Promise<AipgApiError> {
    const text = await response.text().catch(() => "");
    let detail = text;
    try {
      const parsed = JSON.parse(text) as { detail?: unknown; error?: { message?: unknown } };
      detail = String(parsed.detail ?? parsed.error?.message ?? text);
    } catch {
      // A non-JSON upstream error is still reported with a bounded body.
    }
    return new AipgApiError(
      `Grid ${path} failed [${response.status}]: ${bounded(detail || response.statusText)}`,
      response.status,
      response.status === 401 ? "AIPG_AUTH_ERROR" : "AIPG_API_ERROR",
    );
  }

  async listModels(): Promise<AipgModel[]> {
    const result = await this.json<{ data?: AipgModel[] }>("/models");
    return Array.isArray(result.data) ? result.data : [];
  }

  async modelStatus(): Promise<AipgModelStatus[]> {
    const result = await this.json<unknown>("/status/models");
    if (!Array.isArray(result)) {
      throw new AipgApiError("Grid /status/models returned an invalid response", 502);
    }
    return result.filter(
      (entry): entry is AipgModelStatus =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as AipgModelStatus).name === "string" &&
        typeof (entry as AipgModelStatus).count === "number" &&
        typeof (entry as AipgModelStatus).type === "string",
    );
  }

  async credits(): Promise<AipgCredits> {
    return this.json<AipgCredits>("/account/credits");
  }

  async completeText(request: AipgTextRequest): Promise<AipgTextResult> {
    const result = await this.json<{
      choices?: Array<{ message?: { content?: string | null }; finish_reason?: string | null }>;
      usage?: unknown;
    }>(
      "/chat/completions",
      { method: "POST", body: JSON.stringify(this.textBody(request, false)) },
      180_000,
    );
    const choice = result.choices?.[0];
    const text = choice?.message?.content;
    if (typeof text !== "string" || text.length === 0) {
      throw new AipgApiError("Grid returned an empty text completion", 502, "AIPG_EMPTY_OUTPUT");
    }
    if (choice?.finish_reason === "length") {
      throw new AipgApiError(
        "Grid reached the output boundary; refusing a partial completion",
        502,
        "AIPG_INCOMPLETE_OUTPUT",
      );
    }
    return {
      text,
      finishReason: choice?.finish_reason ?? undefined,
      usage: usageFrom(result.usage),
    };
  }

  streamText(
    request: AipgTextRequest,
    onChunk?: (chunk: string) => void | Promise<void>,
  ): AipgTextStream {
    const queue = new TextQueue();
    const text = deferred<string>();
    const usage = deferred<AipgUsage | undefined>();
    const finishReason = deferred<string | undefined>();

    // Consumers commonly choose either `textStream` or the terminal promises.
    // Attach observers so a stream failure never becomes an unhandled rejection
    // merely because the caller did not await every optional metadata promise.
    void text.promise.catch(() => undefined);
    void usage.promise.catch(() => undefined);
    void finishReason.promise.catch(() => undefined);

    void (async () => {
      let fullText = "";
      let finalUsage: AipgUsage | undefined;
      let finalReason: string | undefined;
      let sawDone = false;
      try {
        for await (const event of this.streamEvents(request)) {
          if (event.text) {
            fullText += event.text;
            queue.push(event.text);
            await onChunk?.(event.text);
          }
          if (event.usage) finalUsage = event.usage;
          if (event.finishReason) finalReason = event.finishReason;
          if (event.done) sawDone = true;
        }
        if (!sawDone) {
          throw new AipgApiError(
            "Grid text stream ended before its terminal event",
            502,
            "AIPG_INCOMPLETE_STREAM",
          );
        }
        if (finalReason === "length") {
          throw new AipgApiError(
            "Grid reached the output boundary; refusing a partial completion",
            502,
            "AIPG_INCOMPLETE_OUTPUT",
          );
        }
        if (!fullText) {
          throw new AipgApiError("Grid returned an empty text stream", 502, "AIPG_EMPTY_OUTPUT");
        }
        queue.end();
        text.resolve(fullText);
        usage.resolve(finalUsage);
        finishReason.resolve(finalReason);
      } catch (error) {
        queue.fail(error);
        text.reject(error);
        usage.reject(error);
        finishReason.reject(error);
      }
    })();

    return {
      textStream: queue,
      text: text.promise,
      usage: usage.promise,
      finishReason: finishReason.promise,
    };
  }

  private async *streamEvents(request: AipgTextRequest): AsyncIterable<StreamEvent> {
    const response = await this.request(
      "/chat/completions",
      { method: "POST", body: JSON.stringify(this.textBody(request, true)) },
      180_000,
    );
    if (!response.ok) throw await this.error(response, "/chat/completions");
    if (!response.body) {
      throw new AipgApiError("Grid returned a stream without a body", 502);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? "";
      for (const block of blocks) {
        const event = this.parseSseBlock(block);
        if (event) yield event;
      }
      if (done) break;
    }
    if (buffer.trim()) {
      const event = this.parseSseBlock(buffer);
      if (event) yield event;
    }
  }

  private parseSseBlock(block: string): StreamEvent | undefined {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) return undefined;
    if (data.trim() === "[DONE]") return { done: true };
    let parsed: {
      choices?: Array<{ delta?: { content?: string | null }; finish_reason?: string | null }>;
      usage?: unknown;
    };
    try {
      parsed = JSON.parse(data) as typeof parsed;
    } catch {
      throw new AipgApiError("Grid returned malformed SSE data", 502, "AIPG_MALFORMED_STREAM");
    }
    return {
      text: parsed.choices?.[0]?.delta?.content ?? undefined,
      finishReason: parsed.choices?.[0]?.finish_reason ?? undefined,
      usage: usageFrom(parsed.usage),
    };
  }

  private textBody(request: AipgTextRequest, stream: boolean): Record<string, unknown> {
    return {
      model: request.model,
      messages: [
        ...(request.system ? [{ role: "system", content: request.system }] : []),
        { role: "user", content: request.prompt },
      ],
      stream,
      ...(stream ? { stream_options: { include_usage: true } } : {}),
      ...(request.maxTokens !== undefined ? { max_tokens: request.maxTokens } : {}),
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      ...(request.topP !== undefined ? { top_p: request.topP } : {}),
      ...(request.frequencyPenalty !== undefined
        ? { frequency_penalty: request.frequencyPenalty }
        : {}),
      ...(request.presencePenalty !== undefined
        ? { presence_penalty: request.presencePenalty }
        : {}),
      ...(request.stop ? { stop: request.stop } : {}),
      ...(request.seed !== undefined ? { seed: request.seed } : {}),
    };
  }

  async generateImage(request: AipgImageRequest): Promise<AipgMediaResult> {
    return this.json<AipgMediaResult>(
      "/images/generations",
      {
        method: "POST",
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          n: request.n ?? 1,
          size: request.size ?? "1024x1024",
          ...(request.image ? { image: request.image } : {}),
          ...(request.seed !== undefined ? { seed: request.seed } : {}),
          ...(request.negativePrompt ? { negative_prompt: request.negativePrompt } : {}),
        }),
      },
      300_000,
    );
  }

  async generateVideo(request: AipgVideoRequest): Promise<AipgMediaResult> {
    return this.json<AipgMediaResult>(
      "/videos/generations",
      {
        method: "POST",
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          n: 1,
          size: request.size ?? "768x512",
          seconds: request.seconds ?? 4,
          fps: request.fps ?? 24,
          ...(request.image ? { image: request.image } : {}),
          ...(request.seed !== undefined ? { seed: request.seed } : {}),
        }),
      },
      600_000,
    );
  }

  async generateAudio(request: AipgAudioRequest): Promise<AipgMediaResult> {
    return this.json<AipgMediaResult>(
      "/audio/generations",
      {
        method: "POST",
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          lyrics: request.lyrics ?? "",
          seconds: request.seconds ?? 30,
          inference_steps: request.inferenceSteps ?? 8,
          ...(request.bpm !== undefined ? { bpm: request.bpm } : {}),
          ...(request.keyScale ? { key_scale: request.keyScale } : {}),
          ...(request.timeSignature ? { time_signature: request.timeSignature } : {}),
          ...(request.vocalLanguage ? { vocal_language: request.vocalLanguage } : {}),
          ...(request.seed !== undefined ? { seed: request.seed } : {}),
        }),
      },
      600_000,
    );
  }
}
