import { ModelType, type TextStreamResult } from "@elizaos/core";
import { describe, expect, it } from "vitest";
import aipgPlugin from "../src/index.js";
import { createRuntime } from "./runtime-fixture.js";

describe.runIf(process.env.AIPG_LIVE_E2E === "1")("AIPG production runtime", () => {
  it("discovers models and completes one bounded stream through AgentRuntime", async () => {
    const apiKey = process.env.AIPG_API_KEY?.trim();
    if (!apiKey) throw new Error("AIPG_API_KEY is required for the explicit live E2E lane");
    const runtime = await createRuntime({
      plugins: [aipgPlugin],
      settings: { AIPG_API_KEY: apiKey },
    });

    try {
      const listAction = runtime.actions.find((action) => action.name === "AIPG_LIST_MODELS");
      if (!listAction) throw new Error("AIPG_LIST_MODELS was not registered");
      const discovery = await listAction.handler(runtime, {} as never, undefined, {});
      expect(discovery).toMatchObject({ success: true });

      const result = (await runtime.useModel(ModelType.TEXT_LARGE, {
        prompt: "Reply with one short word.",
        maxTokens: 8,
        stream: true,
      })) as unknown as TextStreamResult;
      let chunkCount = 0;
      for await (const chunk of result.textStream) {
        if (chunk) chunkCount += 1;
      }
      expect(chunkCount).toBeGreaterThan(0);
      await expect(result.text).resolves.toMatch(/\S/);
    } finally {
      await runtime.stop();
    }
  }, 90_000);
});
