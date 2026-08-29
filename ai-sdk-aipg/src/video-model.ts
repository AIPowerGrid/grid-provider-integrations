import type {
  Experimental_VideoModelV4,
  Experimental_VideoModelV4File,
  Experimental_VideoModelV4Result,
  SharedV4Warning,
} from "@ai-sdk/provider";
import { AipgApiError, type AipgClient, definedHeaders, fileToDataURI } from "./client.js";
import type { AipgVideoModelId, AipgVideoProviderOptions } from "./types.js";

function providerOptions(value: unknown): AipgVideoProviderOptions {
  if (!value || typeof value !== "object") return {};
  return value as AipgVideoProviderOptions;
}

function sourceImage(file: Experimental_VideoModelV4File | undefined): string | undefined {
  if (!file) return undefined;
  if (file.type === "url") {
    throw new AipgApiError("Grid video source inputs must be inline files, not remote URLs", 400);
  }
  if (!file.mediaType.startsWith("image/")) {
    throw new AipgApiError("Grid video generation accepts an image start frame", 400);
  }
  return fileToDataURI(file);
}

export class AipgVideoModel implements Experimental_VideoModelV4 {
  readonly specificationVersion = "v4";
  readonly provider = "aipg.video";
  readonly maxVideosPerCall = 2;

  constructor(
    readonly modelId: AipgVideoModelId,
    private readonly client: AipgClient,
  ) {}

  async doGenerate(
    options: Parameters<NonNullable<Experimental_VideoModelV4["doGenerate"]>>[0],
  ): Promise<Experimental_VideoModelV4Result> {
    const warnings: SharedV4Warning[] = [];
    if (options.aspectRatio) {
      warnings.push({
        type: "unsupported",
        feature: "aspectRatio",
        details: "Use the AI SDK resolution option for Grid video generation.",
      });
    }
    if (options.generateAudio != null) {
      warnings.push({
        type: "unsupported",
        feature: "generateAudio",
        details: "Audio behavior is selected by the Grid video model, not this flag.",
      });
    }
    if (options.frameImages?.length) {
      throw new AipgApiError("Grid video generation does not accept AI SDK frameImages", 400);
    }
    if (options.inputReferences?.length) {
      throw new AipgApiError("Grid video generation does not accept AI SDK inputReferences", 400);
    }
    const image = sourceImage(options.image);
    const extra = providerOptions(options.providerOptions.aipg);
    const status = await this.client.assertOnline(this.modelId, "video");
    this.client.assertCapability(status, image ? "img2video" : "txt2video");

    const response = await this.client.request<{
      data?: Array<{ url?: string; seed?: number }>;
      grid?: Record<string, unknown>;
    }>("/videos/generations", {
      method: "POST",
      signal: options.abortSignal,
      headers: definedHeaders(options.headers),
      body: JSON.stringify({
        model: this.modelId,
        prompt: options.prompt ?? "",
        n: options.n,
        size: options.resolution,
        seconds: options.duration,
        fps: options.fps,
        seed: options.seed,
        image,
        response_format: "url",
        negative_prompt: extra.negativePrompt,
        steps: extra.steps,
        cfg_scale: extra.cfgScale,
        sampler: extra.sampler,
        scheduler: extra.scheduler,
      }),
    });
    const videos = (response.data ?? []).flatMap((item) =>
      item.url ? [{ type: "url" as const, url: item.url, mediaType: "video/mp4" }] : [],
    );
    if (videos.length !== options.n) {
      throw new AipgApiError(
        `Grid returned ${videos.length} of ${options.n} requested videos`,
        502,
      );
    }
    return {
      videos,
      warnings,
      response: { timestamp: new Date(), modelId: this.modelId, headers: undefined },
      providerMetadata: {
        aipg: {
          seeds: (response.data ?? []).map((item) => item.seed ?? null),
        },
      },
    };
  }
}
