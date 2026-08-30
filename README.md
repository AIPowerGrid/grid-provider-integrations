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
- [`AIPowerGrid/n8n-nodes-aipg`](https://github.com/AIPowerGrid/n8n-nodes-aipg)
  - dedicated n8n community node for text, image, video, and audio workflows
  with encrypted API-key credentials.
- [`starters/`](starters/) - runnable on-chain game NPC, DAO media, Telegram,
  NFT media, and wallet-funded agent examples with quote-before-dispatch cost
  guards and no wallet keys in the inference process.

Weekly implementation evidence is recorded under [`proof/`](proof/). Each
report distinguishes local verification, upstream submission, upstream merge,
and remaining release gates.

Builder-facing setup instructions and publication status are live at
[aipowergrid.io/docs/integrations](https://aipowergrid.io/docs/integrations).
The public page treats compatibility, first-party tests, package publication,
and upstream acceptance as separate states.

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

## Generate an honest weekly proof snapshot

Generate the operational and payout copy directly from the public Grid APIs:

```bash
npm run proof:weekly
```

To refresh a dated artifact, pass an explicit output path. The generator reads
only public network-status, job-total, and payout endpoints. It refuses an
unknown status schema or economically active validator state, calculates job
totals itself, and preserves paid-demand, independent-operator, external-builder,
and historical-uptime metrics as explicit gaps when the public APIs cannot
prove them.

## Bounded production release gate

Before publishing a provider package, create a disposable key carrying only
`account.read` and `inference.submit`, enable charging for that account, and
run the four-integration gate:

```bash
AIPG_LIVE_E2E=1 AIPG_API_KEY='...' npm run release:e2e:live
```

The gate quotes six fixed requests before dispatching, requires sufficient
credit and active charging, and refuses to exceed a hard `$0.03` ceiling. It
then exercises Dify, AI SDK, ElizaOS, and LangChain in sequence and checks that
spend changed within the preflight bound. The n8n package owns its live release
gate in its dedicated repository. Neither gate prints or persists the key,
account balances, prompts, generated content, response headers, or worker
identity. Revoke the disposable key immediately after the run.

After revoking it in the Console, keep the same environment variable only long
enough to prove the credential is dead:

```bash
npm run release:key:verify-revoked
unset AIPG_API_KEY AIPG_LIVE_E2E AIPG_E2E_MAX_SPEND_USD
```

The revocation proof calls only the fixed production credit-summary endpoint,
does not read a response body, and succeeds only on `401`. Any other status is
ambiguous and fails closed.

This package-level gate does not replace Dify Community Edition and Cloud UI
installation checks, npm provenance, or upstream review.

The three provider packages are public on npm:

- `@aipowergrid/ai-sdk-provider@0.1.0`
- `@aipowergrid/plugin-aipg@0.1.0`
- `@aipowergrid/n8n-nodes-aipg@0.1.3`

Each package trusts only its matching GitHub Actions workflow through npm OIDC.
The one-time bootstrap token and both repository `NPM_TOKEN` secrets were
removed after first publication. Never publish locally or restore a long-lived
registry token: the tag workflows are serialized, require the tag to match
`package.json`, reject release commits that are not already on `main`, and
produce npm provenance tied to the release commit.

The publication workflows deliberately disable `setup-node` package-manager
caching. Release jobs carry OIDC permission, and restoring a writable package
cache into that job creates an avoidable cache-poisoning path. Ordinary CI may
still use lock-keyed caches because it has no package-publish permission.
