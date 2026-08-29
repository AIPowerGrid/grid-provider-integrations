import { generateText, streamText } from "ai";
import { describe, expect, it } from "vitest";
import { AipgApiError, createAipg } from "../src/index.js";

interface Call {
  url: string;
  method: string;
  authorization: string | null;
  body?: Record<string, unknown>;
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fixture(handlers: Record<string, (call: Call) => Response>): {
  calls: Call[];
  fetch: typeof globalThis.fetch;
} {
  const calls: Call[] = [];
  const fetch = async (input: URL | RequestInfo, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = new Headers(init?.headers);
    const call: Call = {
      url,
      method: init?.method ?? "GET",
      authorization: headers.get("authorization"),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    const path = new URL(url).pathname;
    const handler = handlers[path];
    if (!handler) throw new Error(`Unexpected request: ${call.method} ${path}`);
    return handler(call);
  };
  return { calls, fetch: fetch as typeof globalThis.fetch };
}

function status(name: string, type: string, capabilities?: string[]): Response {
  return json([{ name, type, count: 1, capabilities }]);
}

describe("AI Power Grid AI SDK provider", () => {
  it("requires a server-side API key", () => {
    const previous = process.env.AIPG_API_KEY;
    delete process.env.AIPG_API_KEY;
    try {
      expect(() => createAipg()).toThrow("AIPG_API_KEY is required");
    } finally {
      if (previous) process.env.AIPG_API_KEY = previous;
    }
  });

  it("does not allow custom headers to replace the Grid credential", () => {
    expect(() =>
      createAipg({ apiKey: "grid_test", headers: { authorization: "Bearer attacker" } }),
    ).toThrow("with apiKey");
  });

  it("never sends the environment Grid key to a custom base URL", () => {
    const previous = process.env.AIPG_API_KEY;
    process.env.AIPG_API_KEY = "grid_environment_secret";
    try {
      expect(() => createAipg({ baseURL: "https://example.com/v1" })).toThrow(
        "requires an explicit apiKey",
      );
      expect(() =>
        createAipg({ apiKey: "grid_explicit_fixture", baseURL: "https://example.com/v1" }),
      ).not.toThrow();
    } finally {
      if (previous === undefined) delete process.env.AIPG_API_KEY;
      else process.env.AIPG_API_KEY = previous;
    }
  });

  it("uses the standard AI SDK language model interface", async () => {
    const mock = fixture({
      "/v1/chat/completions": (call) =>
        json({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1,
          model: call.body?.model,
          choices: [
            { index: 0, message: { role: "assistant", content: "ready" }, finish_reason: "stop" },
          ],
          usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
        }),
    });
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://127.0.0.1/v1",
      fetch: mock.fetch,
    });
    const result = await generateText({ model: aipg("auto"), prompt: "Say ready" });

    expect(result.text).toBe("ready");
    expect(mock.calls[0]).toMatchObject({
      url: "http://127.0.0.1/v1/chat/completions",
      method: "POST",
      authorization: "Bearer grid_test",
    });
    expect(mock.calls[0].body).toMatchObject({ model: "auto" });
  });

  it("streams text through the standard AI SDK interface", async () => {
    const mock = fixture({
      "/v1/chat/completions": () =>
        new Response(
          [
            'data: {"id":"chatcmpl-stream","object":"chat.completion.chunk","created":1,"model":"auto","choices":[{"index":0,"delta":{"role":"assistant","content":"grid"},"finish_reason":null}]}',
            'data: {"id":"chatcmpl-stream","object":"chat.completion.chunk","created":1,"model":"auto","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}',
            "data: [DONE]",
            "",
          ].join("\n\n"),
          { status: 200, headers: { "Content-Type": "text/event-stream" } },
        ),
    });
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://127.0.0.1/v1",
      fetch: mock.fetch,
    });
    const result = streamText({ model: aipg("auto"), prompt: "Say grid" });
    let text = "";
    for await (const chunk of result.textStream) text += chunk;

    expect(text).toBe("grid");
    expect(mock.calls[0].body).toMatchObject({ model: "auto", stream: true });
  });

  it("maps image generation and inline img2img to the Grid contract", async () => {
    const model = "Krea 2 Turbo";
    const mock = fixture({
      "/v1/status/models": () => status(model, "image", ["txt2img", "img2img"]),
      "/v1/images/generations": () =>
        json({ data: [{ b64_json: "aGVsbG8=", seed: 42 }], grid: { worker_id: "redacted" } }),
    });
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://localhost/v1",
      fetch: mock.fetch,
    });
    const result = await aipg.imageModel(model).doGenerate({
      prompt: "a copper circuit",
      n: 1,
      size: "1024x1024",
      aspectRatio: undefined,
      seed: 42,
      files: [{ type: "file", mediaType: "image/png", data: new Uint8Array([1, 2, 3]) }],
      mask: undefined,
      providerOptions: { aipg: { negativePrompt: "blur", outputFormat: "png" } },
    });

    expect(result.images).toEqual(["aGVsbG8="]);
    expect(mock.calls.map((call) => new URL(call.url).pathname)).toEqual([
      "/v1/status/models",
      "/v1/images/generations",
    ]);
    expect(mock.calls[1].body).toMatchObject({
      model,
      prompt: "a copper circuit",
      response_format: "b64_json",
      image: "data:image/png;base64,AQID",
      negative_prompt: "blur",
      output_format: "png",
    });
  });

  it("fails before a paid image request when the model is not online for images", async () => {
    const mock = fixture({
      "/v1/status/models": () => status("same-name", "text"),
    });
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://localhost/v1",
      fetch: mock.fetch,
    });
    await expect(
      aipg.imageModel("same-name").doGenerate({
        prompt: "test",
        n: 1,
        size: undefined,
        aspectRatio: undefined,
        seed: undefined,
        files: undefined,
        mask: undefined,
        providerOptions: {},
      }),
    ).rejects.toMatchObject({ status: 503 });
    expect(mock.calls).toHaveLength(1);
  });

  it("rejects remote image inputs rather than silently fetching them", async () => {
    const mock = fixture({});
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://localhost/v1",
      fetch: mock.fetch,
    });
    await expect(
      aipg.imageModel("Krea 2 Turbo").doGenerate({
        prompt: "test",
        n: 1,
        size: undefined,
        aspectRatio: undefined,
        seed: undefined,
        files: [{ type: "url", url: "https://example.com/private.png" }],
        mask: undefined,
        providerOptions: {},
      }),
    ).rejects.toThrow("inline files");
    expect(mock.calls).toHaveLength(0);
  });

  it("maps the experimental AI SDK video interface", async () => {
    const model = "LTX-2.3";
    const mock = fixture({
      "/v1/status/models": () => status(model, "video", ["img2video"]),
      "/v1/videos/generations": () =>
        json({ data: [{ url: "https://media.example/video.mp4", seed: 7 }] }),
    });
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://localhost/v1",
      fetch: mock.fetch,
    });
    const result = await aipg.videoModel(model).doGenerate?.({
      prompt: "camera pushes forward",
      n: 1,
      aspectRatio: undefined,
      resolution: "768x512",
      duration: 4,
      fps: 24,
      seed: 7,
      image: { type: "file", mediaType: "image/webp", data: "YWJj" },
      frameImages: undefined,
      inputReferences: undefined,
      generateAudio: undefined,
      providerOptions: { aipg: { steps: 8 } },
    });

    expect(result?.videos).toEqual([
      { type: "url", url: "https://media.example/video.mp4", mediaType: "video/mp4" },
    ]);
    expect(mock.calls[1].body).toMatchObject({
      model,
      size: "768x512",
      seconds: 4,
      fps: 24,
      image: "data:image/webp;base64,YWJj",
      steps: 8,
    });
  });

  it("rejects a video input shape the selected model does not advertise", async () => {
    const model = "LTX-2.3";
    const mock = fixture({
      "/v1/status/models": () => status(model, "video", ["img2video"]),
    });
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://localhost/v1",
      fetch: mock.fetch,
    });
    await expect(
      aipg.videoModel(model).doGenerate?.({
        prompt: "no source frame",
        n: 1,
        aspectRatio: undefined,
        resolution: undefined,
        duration: undefined,
        fps: undefined,
        seed: undefined,
        image: undefined,
        frameImages: undefined,
        inputReferences: undefined,
        generateAudio: undefined,
        providerOptions: {},
      }),
    ).rejects.toThrow("txt2video");
    expect(mock.calls).toHaveLength(1);
  });

  it("rejects media generation when capability metadata is absent", async () => {
    const model = "Krea 2 Turbo";
    const mock = fixture({
      "/v1/status/models": () => status(model, "image"),
    });
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://localhost/v1",
      fetch: mock.fetch,
    });

    await expect(
      aipg.imageModel(model).doGenerate({
        prompt: "a circuit",
        n: 1,
        size: undefined,
        aspectRatio: undefined,
        seed: undefined,
        files: undefined,
        mask: undefined,
        providerOptions: {},
      }),
    ).rejects.toThrow("txt2img");
    expect(mock.calls).toHaveLength(1);
  });

  it("exposes music as music, with exact Grid control names", async () => {
    const model = "ace-step-v1.5-xl-turbo";
    const mock = fixture({
      "/v1/status/models": () => status(model, "audio"),
      "/v1/audio/generations": () =>
        json({ created: 10, data: [{ url: "https://media.example/song.wav", seed: 9 }] }),
    });
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://localhost/v1",
      fetch: mock.fetch,
    });
    const result = await aipg.generateMusic({
      prompt: "folk rock in A minor",
      lyrics: "Across the grid",
      seconds: 20,
      inferenceSteps: 8,
      bpm: 96,
      keyScale: "A minor",
      timeSignature: "4/4",
      vocalLanguage: "en",
      seed: 9,
    });

    expect(result.url).toBe("https://media.example/song.wav");
    expect(mock.calls[1].body).toMatchObject({
      model,
      inference_steps: 8,
      key_scale: "A minor",
      time_signature: "4/4",
      vocal_language: "en",
    });
  });

  it("bounds API errors, redacts the credential, and preserves status", async () => {
    const mock = fixture({
      "/v1/account/credits": () =>
        json({ detail: `upstream echoed grid_test ${"x".repeat(1000)}` }, 401),
    });
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://localhost/v1",
      fetch: mock.fetch,
    });
    const error = await aipg.credits().catch((value: unknown) => value);
    expect(error).toBeInstanceOf(AipgApiError);
    expect(error).toMatchObject({ status: 401 });
    expect((error as Error).message.length).toBeLessThanOrEqual(403);
    expect((error as Error).message).not.toContain("grid_test");
    expect((error as Error).message).toContain("[REDACTED]");
  });

  it("exposes the canonical non-mutating price quote", async () => {
    const mock = fixture({
      "/v1/account/credits/quote": (call) =>
        json({
          ...call.body,
          priced: true,
          cost_micro: 2500,
          cost_usd: 0.0025,
          charging_enabled: true,
        }),
    });
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://localhost/v1",
      fetch: mock.fetch,
    });
    const quote = await aipg.quote({ model: "Krea 2 Turbo", modality: "image", n: 2 });
    expect(quote.cost_micro).toBe(2500);
    expect(mock.calls[0].body).toMatchObject({
      model: "Krea 2 Turbo",
      modality: "image",
      prompt_tokens: 0,
      max_tokens: 0,
      n: 2,
    });
  });

  it("keeps the public text catalog distinct from raw online capacity", async () => {
    const mock = fixture({
      "/v1/models": () =>
        json({ object: "list", data: [{ id: "auto", object: "model", owned_by: "aipowergrid" }] }),
    });
    const aipg = createAipg({
      apiKey: "grid_test",
      baseURL: "http://localhost/v1",
      fetch: mock.fetch,
    });
    await expect(aipg.listTextModels()).resolves.toEqual([
      { id: "auto", object: "model", owned_by: "aipowergrid" },
    ]);
  });
});
