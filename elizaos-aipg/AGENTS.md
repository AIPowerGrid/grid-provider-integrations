# elizaos-aipg - ElizaOS integration

## Purpose

Installable ElizaOS plugin that can use AI Power Grid for text reasoning and
explicit image, video, and music generation. The package targets the published
ElizaOS plugin API and uses only documented Grid `/v1` contracts.

## Ownership

- `src/client.ts` - dependency-free Grid HTTP client, typed errors, SSE text
  streaming, model discovery, credits, and media generation.
- `src/models.ts` - ElizaOS text and image model handlers.
- `src/actions.ts` - explicit text, image, video, audio, model-list, and
  credit-status actions.
- `src/index.ts` - plugin assembly and public exports.
- `tests/` - mocked wire-contract and action/model tests. Tests must never use
  a real API key or spend credits.

## Local Contracts

- Production traffic is fixed to `https://api.aipowergrid.io/v1`. A custom
  base URL is a constructor-only test seam and must never be accepted from an
  action prompt or character-controlled parameter.
- Read the API key from the runtime `AIPG_API_KEY` setting, then the process
  environment. Never put it in action parameters, logs, errors, or reports.
- Keys need `inference.submit`; model/credit inspection also needs
  `account.read`. Validation and initialization must not generate media or text.
- Text must support both bounded non-streaming and SSE streaming. Treat a
  truncated or malformed stream as an error; never return partial output as a
  successful completion.
- Register image generation through ElizaOS `ModelType.IMAGE`. Video and audio
  remain explicit actions because the stable ElizaOS model types describe
  processing inputs, not generative request contracts.
- Do not claim confidential inference. Prompts and media are sent to remote,
  community-operated workers selected by Grid Core.
- Do not imply an ElizaOS partnership or upstream acceptance until the package
  is actually accepted in the ElizaOS registry.

## Verification

- `bun run typecheck`
- `bun run lint`
- `bun test`
- `bun run build`
- `bun audit --production` - the published package has no bundled runtime
  dependencies. A full development-tree audit also reports upstream findings
  inherited from `@elizaos/core`; record those separately before release.

## Child DOX Index

- None.
