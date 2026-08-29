# AI Power Grid Provider Integrations

This workspace turns AIPG's public `/v1` API into tested integrations for
frameworks developers already use. It starts with one reusable conformance
runner so every provider contribution proves the same baseline instead of
shipping a different hand-written smoke test.

## Integrations

- [`dify-aipg/`](dify-aipg/) - native Dify LLM provider for the Grid's live
  OpenAI-compatible text models.
- [`elizaos-aipg/`](elizaos-aipg/) - ElizaOS text model provider plus explicit
  image, video, and music actions.
- [`open-webui-aipg/`](open-webui-aipg/) - Open WebUI direct/admin connection
  guide and upstream documentation draft.
- [`ai-sdk-aipg/`](ai-sdk-aipg/) - native Vercel AI SDK v7 provider for text,
  image, experimental video, and typed music generation.
- [`langchain-aipg/`](langchain-aipg/) - LangChain Python cookbook for model
  discovery, chat, streaming, and tool calls through the standard text API.
- [`n8n-nodes-aipg/`](n8n-nodes-aipg/) - n8n community node for text, image,
  video, and audio workflows with encrypted API-key credentials.

Weekly implementation evidence is recorded under [`proof/`](proof/). Each
report distinguishes local verification, upstream submission, upstream merge,
and remaining release gates.

## Public conformance

Requires Node.js 20 or newer. The default run does not require a key and does
not dispatch generation work:

```bash
npm run conformance:public
```

It checks service discovery, public modality and capacity metadata, and
rejection of missing and invalid credentials before inference dispatch. The
canonical OpenAI model-list shape and missing-model behavior are checked in
authenticated account mode.

## Account and quote conformance

Put a scoped API key in the environment, never in the command line:

```bash
GRID_API_KEY='...' node src/cli.mjs --account
```

This adds read-only credit-summary and canonical quote checks for each online
modality. It does not submit a generation.

## Explicit live text conformance

The live check spends against the authenticated account. It sends one bounded
streaming request and validates event framing without saving its text:

```bash
GRID_API_KEY='...' node src/cli.mjs --account --live-text --model auto
```

The JSON report contains check names, outcomes, status codes, durations, and
structural facts only. It excludes the key, prompts, generated content, account
balances, response headers, and worker identity.

## What this proves

A passing public run proves the currently deployed discovery and authentication
boundary match this runner. An account run additionally proves non-mutating
credit and quote contracts for the supplied account. A live-text run proves one
small streaming request completed at that moment. None of these establish
independent adoption, sustained uptime, private inference, or support for a
third-party framework until that framework's own integration tests pass.

## Verify everything

Install each child package with its locked package manager, then run:

```bash
npm run verify
```

The verification command is non-credentialed and does not submit generation
jobs. Credentialed, credit-spending checks remain explicit release gates.
