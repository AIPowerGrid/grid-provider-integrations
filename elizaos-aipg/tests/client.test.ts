import { describe, expect, it, vi } from "vitest";
import { AipgApiError, AipgClient } from "../src/client.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("AipgClient", () => {
  it("lists live models without spending", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [{ id: "auto" }] }));
    const client = new AipgClient({
      apiKey: "test-key",
      baseUrl: "http://127.0.0.1/v1",
      fetch: fetchMock,
    });

    await expect(client.listModels()).resolves.toEqual([{ id: "auto" }]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1/v1/models",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
        redirect: "error",
      }),
    );
  });

  it("rejects plaintext credentials to a non-loopback host", () => {
    expect(
      () =>
        new AipgClient({
          apiKey: "test-key",
          baseUrl: "http://example.com/v1",
        }),
    ).toThrow("must use HTTPS");
  });

  it("discovers online models across every advertised modality", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse([
        { name: "gpt-oss-120b", count: 2, type: "text" },
        { name: "Krea 2 Turbo", count: 1, type: "image", capabilities: ["txt2img", "img2img"] },
        { name: "LTX-2.3", count: 1, type: "video", capabilities: ["img2video"] },
        { name: "ace-step-v1.5-xl-turbo", count: 1, type: "audio" },
      ]),
    );
    const client = new AipgClient({
      apiKey: "test-key",
      baseUrl: "http://127.0.0.1/v1",
      fetch: fetchMock,
    });

    await expect(client.modelStatus()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "text" }),
        expect.objectContaining({ type: "image" }),
        expect.objectContaining({ type: "video" }),
        expect.objectContaining({ type: "audio" }),
      ]),
    );
  });

  it("maps non-stream text and rejects length truncation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [{ message: { content: "hello" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: "partial" }, finish_reason: "length" }] }),
      );
    const client = new AipgClient({
      apiKey: "test-key",
      baseUrl: "http://127.0.0.1/v1",
      fetch: fetchMock,
    });

    await expect(
      client.completeText({ model: "auto", prompt: "hi", maxTokens: 8 }),
    ).resolves.toEqual({
      text: "hello",
      finishReason: "stop",
      usage: { promptTokens: 2, completionTokens: 1, totalTokens: 3 },
    });
    await expect(client.completeText({ model: "auto", prompt: "hi" })).rejects.toMatchObject({
      code: "AIPG_INCOMPLETE_OUTPUT",
    });
  });

  it("streams chunked SSE and publishes terminal metadata", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"hel"}}]}\n\n'));
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":{"content":"lo"},"finish_reason":"stop"}],"usage":{"prompt_tokens":2,"completion_tokens":1,"total_tokens":3}}\n\n',
          ),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    const chunks: string[] = [];
    const client = new AipgClient({
      apiKey: "test-key",
      baseUrl: "http://127.0.0.1/v1",
      fetch: vi.fn(
        async () =>
          new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } }),
      ),
    });

    const result = client.streamText({ model: "auto", prompt: "hi" });
    for await (const chunk of result.textStream) chunks.push(chunk);

    expect(chunks).toEqual(["hel", "lo"]);
    await expect(result.text).resolves.toBe("hello");
    await expect(result.finishReason).resolves.toBe("stop");
    await expect(result.usage).resolves.toEqual({
      promptTokens: 2,
      completionTokens: 1,
      totalTokens: 3,
    });
  });

  it("fails closed when an SSE stream lacks DONE", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'),
        );
        controller.close();
      },
    });
    const client = new AipgClient({
      apiKey: "test-key",
      baseUrl: "http://127.0.0.1/v1",
      fetch: vi.fn(async () => new Response(stream, { status: 200 })),
    });
    const result = client.streamText({ model: "auto", prompt: "hi" });

    await expect(result.text).rejects.toMatchObject({ code: "AIPG_INCOMPLETE_STREAM" });
  });

  it("bounds provider error text and redacts the API key", async () => {
    const client = new AipgClient({
      apiKey: "test-key",
      baseUrl: "http://127.0.0.1/v1",
      fetch: vi.fn(async () =>
        jsonResponse({ detail: `upstream echoed test-key ${"x".repeat(500)}` }, 402),
      ),
    });
    const error = await client.credits().catch((caught) => caught);

    expect(error).toBeInstanceOf(AipgApiError);
    expect((error as Error).message.length).toBeLessThan(380);
    expect((error as Error).message).not.toContain("test-key");
    expect((error as Error).message).toContain("[REDACTED]");
  });

  it("uses current synchronous media routes and wire names", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ data: [{ url: "https://media.example/result" }] }),
    );
    const client = new AipgClient({
      apiKey: "test-key",
      baseUrl: "http://127.0.0.1/v1",
      fetch: fetchMock,
    });

    await client.generateAudio({
      model: "ACE-Step 1.5 Turbo",
      prompt: "folk rock",
      lyrics: "hello",
      inferenceSteps: 8,
    });
    await client.generateVideo({ model: "LTX-2.3", prompt: "city", seconds: 4 });

    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls[0]?.[0]).toBe("http://127.0.0.1/v1/audio/generations");
    expect(JSON.parse(String(calls[0]?.[1].body))).toMatchObject({
      inference_steps: 8,
      lyrics: "hello",
    });
    expect(calls[1]?.[0]).toBe("http://127.0.0.1/v1/videos/generations");
  });
});
