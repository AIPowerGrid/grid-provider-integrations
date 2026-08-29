import { ModelType } from "@elizaos/core";
import { describe, expect, it, vi } from "vitest";
import aipgPlugin from "../src/index.js";
import { createRuntime } from "./runtime-fixture.js";

describe("AIPG ElizaOS runtime", () => {
  it("loads the plugin and invokes its text model through AgentRuntime", async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "runtime response" }, finish_reason: "stop" }],
            usage: { prompt_tokens: 2, completion_tokens: 2, total_tokens: 4 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );
    const runtime = await createRuntime({
      fetch: fetchMock,
      plugins: [aipgPlugin],
      settings: { AIPG_API_KEY: "grid_runtime_fixture" },
    });

    try {
      expect(runtime.actions.some((action) => action.name === "AIPG_LIST_MODELS")).toBe(true);
      await expect(
        runtime.useModel(ModelType.TEXT_LARGE, {
          prompt: "Exercise the registered model handler.",
          maxTokens: 8,
        }),
      ).resolves.toBe("runtime response");
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.aipowergrid.io/v1/chat/completions");
      expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
        headers: expect.objectContaining({ Authorization: "Bearer grid_runtime_fixture" }),
      });
    } finally {
      await runtime.stop();
    }
  });
});
