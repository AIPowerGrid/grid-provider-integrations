import type {
  ImageModelV4,
  ImageModelV4File,
  ImageModelV4Result,
  SharedV4Warning,
} from "@ai-sdk/provider";
import {
  AipgApiError,
  type AipgClient,
  definedHeaders,
  fileToDataURI,
  imageMediaType,
} from "./client.js";
import type { AipgImageModelId, AipgImageProviderOptions } from "./types.js";

function providerOptions(value: unknown): AipgImageProviderOptions {
  if (!value || typeof value !== "object") return {};
  return value as AipgImageProviderOptions;
}

function sourceFile(files: ImageModelV4File[] | undefined): string | undefined {
  if (!files?.length) return undefined;
  if (files.length > 1)
    throw new AipgApiError("Grid image generation accepts one source image", 400);
  const file = files[0];
  if (file.type === "url") {
    throw new AipgApiError("Grid image source inputs must be inline files, not remote URLs", 400);
  }
  return fileToDataURI(file);
}

export class AipgImageModel implements ImageModelV4 {
  readonly specificationVersion = "v4";
  readonly provider = "aipg.image";
  readonly maxImagesPerCall = 4;

  constructor(
    readonly modelId: AipgImageModelId,
    private readonly client: AipgClient,
  ) {}

  async doGenerate(
    options: Parameters<ImageModelV4["doGenerate"]>[0],
  ): Promise<ImageModelV4Result> {
    const warnings: SharedV4Warning[] = [];
    if (options.aspectRatio) {
      warnings.push({
        type: "unsupported",
        feature: "aspectRatio",
        details: "Use the AI SDK size option for Grid image generation.",
      });
    }
    if (options.mask) {
      throw new AipgApiError("Grid image generation does not currently support masks", 400);
    }
    const source = sourceFile(options.files);
    const extra = providerOptions(options.providerOptions.aipg);
    const status = await this.client.assertOnline(this.modelId, "image");
    this.client.assertCapability(status, source ? "img2img" : "txt2img");

    const response = await this.client.request<{
      data?: Array<{ b64_json?: string; seed?: number }>;
      grid?: Record<string, unknown>;
    }>("/images/generations", {
      method: "POST",
      signal: options.abortSignal,
      headers: definedHeaders(options.headers),
      body: JSON.stringify({
        model: this.modelId,
        prompt: options.prompt ?? "",
        n: options.n,
        size: options.size,
        seed: options.seed,
        image: source,
        response_format: "b64_json",
        output_format: extra.outputFormat,
        negative_prompt: extra.negativePrompt,
        steps: extra.steps,
        cfg_scale: extra.cfgScale,
        sampler: extra.sampler,
        scheduler: extra.scheduler,
        strength: extra.strength,
      }),
    });
    const images = (response.data ?? []).map((item) => item.b64_json).filter(Boolean) as string[];
    if (images.length !== options.n) {
      throw new AipgApiError(
        `Grid returned ${images.length} of ${options.n} requested images`,
        502,
      );
    }
    return {
      images,
      warnings,
      response: { timestamp: new Date(), modelId: this.modelId, headers: undefined },
      providerMetadata: {
        aipg: {
          images: (response.data ?? []).map((item) => ({ seed: item.seed ?? null })),
          mediaType: imageMediaType(extra.outputFormat),
        },
      },
    };
  }
}
