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
- `tests/` - mocked wire-contract tests, a real `AgentRuntime` registration
  lane, and an explicit credentialed production lane. Default tests must never
  use a real API key or spend credits.
- `upstream-registry-entry.json` and `REGISTRY_SUBMISSION.md` - source-ready
  draft for the active in-monorepo elizaOS community registry. The entry is
  not proof of npm publication or registry acceptance.

## Local Contracts

- Production traffic is fixed to `https://api.aipowergrid.io/v1`. A custom
  base URL is a constructor-only test seam and must never be accepted from an
  action prompt or character-controlled parameter.
- The client rejects plaintext non-loopback bases, refuses redirects, and
  redacts its credential if an upstream error body echoes it.
- Read the API key from the runtime `AIPG_API_KEY` setting, then the process
  environment. Never put it in action parameters, logs, errors, or reports.
- Keys need `inference.submit`; model/credit inspection also needs
  `account.read`. Validation and initialization must not generate media or text.
- Text must support both bounded non-streaming and SSE streaming. Treat a
  truncated or malformed stream as an error; never return partial output as a
  successful completion.
- The explicit production lane uses `AIPG_E2E_ELIZA_MODEL` and a bounded
  production-grade text model. Do not use a backend known to exhaust its output
  allowance as the release oracle for strict truncation handling.
- Register image generation through ElizaOS `ModelType.IMAGE`. Video and audio
  remain explicit actions because the stable ElizaOS model types describe
  processing inputs, not generative request contracts.
- Do not claim confidential inference. Prompts and media are sent to remote,
  community-operated workers selected by Grid Core.
- Do not imply an ElizaOS partnership or upstream acceptance until the package
  is actually accepted in the ElizaOS registry.
- The active registry target is `elizaOS/eliza` `develop`, under
  `packages/registry/entries/third-party/`. Do not submit to the archived
  `elizaos-plugins/registry` repository.

## Verification

- `bun run typecheck`
- `bun run lint:check`
- `bun test`
- `bun run build`
- `npm pack --dry-run` - inspect the exact package payload.
- `npm run test:package:elizaos` from the repository root - pack, install, and
  import the exact release payload with the declared ElizaOS host peer in a
  disposable clean consumer.
- `AIPG_API_KEY="..." bun run test:e2e:live` - explicit pre-release production
  check with a disposable scoped key; this spends one bounded text request and
  must never run in default CI.
- `bun audit --production` - the published package has no bundled runtime
  dependencies. A full development-tree audit also reports upstream findings
  inherited from `@elizaos/core`; record those separately before release.
- Publish only through `.github/workflows/publish-packages.yml` using a matching
  `plugin-aipg-vX.Y.Z` tag and npm provenance.

## Child DOX Index

- None.
