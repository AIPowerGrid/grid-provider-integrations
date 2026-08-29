import { streamText } from "ai";
import { describe, expect, it } from "vitest";
import { createAipg } from "../src/index.js";

describe.runIf(process.env.AIPG_LIVE_E2E === "1")("AIPG AI SDK production runtime", () => {
  it("discovers models, reads account status, and completes one bounded stream", async () => {
    const apiKey = process.env.AIPG_API_KEY?.trim();
    if (!apiKey) throw new Error("AIPG_API_KEY is required for the explicit live E2E lane");
    const provider = createAipg({ apiKey, timeoutMs: 90_000 });

    const [models, credits] = await Promise.all([provider.listTextModels(), provider.credits()]);
    expect(models.some((model) => model.id === "auto")).toBe(true);
    expect(credits).toBeTypeOf("object");

    const result = streamText({
      model: provider("auto"),
      prompt: "Reply with one short word.",
      maxOutputTokens: 8,
    });
    let chunkCount = 0;
    for await (const chunk of result.textStream) {
      if (chunk) chunkCount += 1;
    }

    expect(chunkCount).toBeGreaterThan(0);
    await expect(result.text).resolves.toMatch(/\S/);
    await expect(result.finishReason).resolves.toMatch(/^(stop|length)$/);
  }, 90_000);
});
