# grid-provider-integrations - upstream provider integrations

## Purpose

Reusable conformance tooling and source packages for making AI Power Grid a
native, reviewed provider in third-party AI frameworks. This workspace is the
staging ground for Dify, ElizaOS, Vercel AI SDK, LiteLLM, Open WebUI,
LangChain, and n8n contributions; upstream repositories remain the final
authority for submission structure and acceptance.

## Ownership

- `src/` - dependency-free AIPG API conformance runner and CLI.
- `test/` - deterministic mock-server coverage for the conformance contract
  plus release-contract checks keeping packages, workflows, and submission
  drafts aligned.
- `dify-aipg/` - native Dify model-provider plugin for Grid text inference.
- `elizaos-aipg/` - ElizaOS model/action plugin for Grid text, image, video,
  and music generation.
- `open-webui-aipg/` - tested Open WebUI setup guide and upstream tutorial
  draft for the standard OpenAI-compatible connection path.
- `ai-sdk-aipg/` - Vercel AI SDK v7 provider for text, image, video, and music.
- `langchain-aipg/` - tested LangChain Python cookbook for Grid text models.
- `n8n-nodes-aipg/` - native n8n community node for Grid text, image, video,
  and audio generation.
- `proof/` - dated evidence reports that separate tests, submissions, merges,
  open release gates, and publication-ready weekly proof copy. Every number in
  a proof post must link to a public source and preserve unavailable metrics as
  explicit gaps rather than estimates.
- Each integration directory also owns source-ready upstream or marketplace
  submission notes. These drafts must preserve the distinction between local
  readiness, registry publication, upstream submission, and upstream
  acceptance.
- Future integration folders must have their own `AGENTS.md`, package metadata,
  upstream source reference, tests, and submission notes.

## Local Contracts

- The default conformance run is read-only except for deliberately invalid,
  authentication-gated requests that Core rejects before dispatch.
- Account checks read `GRID_API_KEY` or an explicitly named environment
  variable. Never accept, print, persist, or place keys in command arguments.
- A real generation requires both a key and the explicit `--live-text` flag.
  Keep its prompt and output bound small and never imply one run proves uptime,
  quality, billing, privacy, or every modality.
- Record only structural evidence and timing. Do not persist prompts, generated
  content, account balances, worker identities, or response headers.
- Integrations must use documented `/v1` interfaces and scoped keys. Do not
  revive Horde endpoints or add provider-specific behavior to Core merely to
  satisfy a third-party framework.
- A first-party demo or passing mock is not upstream adoption. Record a merged
  upstream PR or accepted marketplace package separately.

## Verification

- `npm test`
- `npm run conformance:public`
- `npm run check`
- `npm run verify`

## Child DOX Index

- [dify-aipg/AGENTS.md](dify-aipg/AGENTS.md) - Dify provider package and tests.
- [elizaos-aipg/AGENTS.md](elizaos-aipg/AGENTS.md) - ElizaOS provider and
  multimodal action package.
- [open-webui-aipg/AGENTS.md](open-webui-aipg/AGENTS.md) - Open WebUI
  connection guide, checks, and upstream submission notes.
- [ai-sdk-aipg/AGENTS.md](ai-sdk-aipg/AGENTS.md) - Vercel AI SDK provider
  package, tests, and community-provider documentation draft.
- [langchain-aipg/AGENTS.md](langchain-aipg/AGENTS.md) - LangChain cookbook,
  model discovery helper, and local protocol tests.
- [n8n-nodes-aipg/AGENTS.md](n8n-nodes-aipg/AGENTS.md) - n8n node contracts,
  credentials, model discovery, and release verification.
