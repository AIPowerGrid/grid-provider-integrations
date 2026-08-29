import type { HandlerOptions, IAgentRuntime } from "@elizaos/core";
import { describe, expect, it, vi } from "vitest";
import { videoAction } from "../src/actions.js";
import { aipgPlugin, creditStatusAction } from "../src/index.js";

function runtime(key?: string): IAgentRuntime {
  return {
    getSetting: vi.fn((name: string) => (name === "AIPG_API_KEY" ? key : undefined)),
  } as unknown as IAgentRuntime;
}

describe("aipgPlugin", () => {
  it("registers all generation actions and model handlers", () => {
    expect(aipgPlugin.actions?.map((action) => action.name)).toEqual([
      "AIPG_CHAT",
      "AIPG_GENERATE_IMAGE",
      "AIPG_GENERATE_VIDEO",
      "AIPG_GENERATE_AUDIO",
      "AIPG_LIST_MODELS",
      "AIPG_CREDIT_STATUS",
    ]);
    expect(Object.keys(aipgPlugin.models ?? {})).toContain("IMAGE");
    expect(Object.keys(aipgPlugin.models ?? {})).toContain("TEXT_LARGE");
  });

  it("hides actions when no API key is configured", async () => {
    await expect(creditStatusAction.validate(runtime(), {} as never)).resolves.toBe(false);
  });

  it("reads credit status without placing a generation request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ total_spendable_usd: 1.25, charging_enabled: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const callback = vi.fn(async () => []);

    const result = await creditStatusAction.handler(
      runtime("test-key"),
      {} as never,
      undefined,
      {} as HandlerOptions,
      callback,
    );

    expect(result).toMatchObject({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.aipowergrid.io/v1/account/credits");
    fetchMock.mockRestore();
  });

  it("rejects a model whose online modality does not match before generation", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ name: "Krea 2 Turbo", count: 1, type: "image" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await videoAction.handler(runtime("test-key"), {} as never, undefined, {
      parameters: { prompt: "move", model: "Krea 2 Turbo" },
    } as HandlerOptions);

    expect(result).toMatchObject({ success: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockRestore();
  });
});
