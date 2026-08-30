# grid-provider-integrations - upstream provider integrations

## Purpose

Reusable conformance tooling and source packages for making AI Power Grid a
native, reviewed provider in third-party AI frameworks. This workspace is the
staging ground for Dify, ElizaOS, Vercel AI SDK, LiteLLM, Open WebUI, and
LangChain contributions, plus evidence for the dedicated n8n package;
upstream repositories remain the final authority for submission structure and
acceptance.

## Ownership

- `src/` - dependency-free AIPG API conformance runner and CLI.
- `test/` - deterministic mock-server coverage for the conformance contract
  plus release-contract and builder-intake checks keeping packages, workflows,
  public forms, and submission drafts aligned.
- `dify-aipg/` - native Dify model-provider plugin for Grid text inference.
- `elizaos-aipg/` - ElizaOS model/action plugin for Grid text, image, video,
  and music generation.
- `open-webui-aipg/` - tested Open WebUI setup guide and upstream tutorial
  draft for the standard OpenAI-compatible connection path.
- `ai-sdk-aipg/` - Vercel AI SDK v7 provider for text, image, video, and music.
- `langchain-aipg/` - tested LangChain Python cookbook for Grid text models.
- `AIPowerGrid/n8n-nodes-aipg` - dedicated canonical repository for the native
  n8n community node. This monorepo tracks its public npm evidence only; do not
  recreate or publish an n8n package from here.
- `starters/` - five dependency-free Web3 application examples sharing a
  fixed-origin, quote-gated Grid client. Wallet funding stays out of the
  inference process and receipt IDs are never mislabeled as on-chain proofs.
- `proof/` - dated evidence reports that separate tests, submissions, merges,
  open release gates, and publication-ready weekly proof copy. Every number in
  a proof post must link to a public source and preserve unavailable metrics as
  explicit gaps rather than estimates.
- `.github/ISSUE_TEMPLATE/builder-credits.yml` - public intake for the bounded
  builder-credit pilot. It collects only public project evidence; account IDs
  and all credentials stay out of issues and are exchanged privately only
  after manual selection.
- `BUILDER_CREDIT_REVIEW.md` - maintainer triage, selection, private handoff,
  issuance, and completion contract for that pilot. Applications are
  discoverable through the `builder-credits` label; the public issue never
  carries account or administrative grant identifiers.
- `src/weekly-proof.mjs` plus `scripts/generate-weekly-proof.mjs` - read-only
  weekly snapshot renderer for public job, capacity, validator, and payout
  evidence plus exact npm provenance for provider and agent packages and
  current upstream pull-request states.
  Package provenance evidence must bind the registry integrity digest to the
  DSSE subject and the expected GitHub repository, release tag, workflow, push
  event, source revision, hosted builder, and transparency-log entry. This is a
  fail-closed identity check over npm's registry evidence, not a local
  replacement for npm/Sigstore cryptographic verification.
  Submitted provider evidence includes the Dify marketplace review; an omitted
  required integration is a failing evidence contract, not an unpublished gap.
  It deliberately reports paid-demand, operator-independence, and
  historical-uptime gaps instead of inferring them, and fails closed when
  published integration evidence drifts. Its capacity post may link to the
  reviewed `/run` operator funnel only while retaining the non-economic
  validator and no-earnings-promise boundaries.
- `scripts/smoke-packed-package.mjs` - installs the exact AI SDK or ElizaOS
  tarball into a disposable clean consumer with its declared host peer, imports
  the public package name, and removes the consumer afterward.
- `scripts/verify-revoked-key.mjs` - fixed-origin, body-blind post-release proof
  that the disposable production key has been revoked and now returns `401`.
- Each integration directory also owns source-ready upstream or marketplace
  submission notes. These drafts must preserve the distinction between local
  readiness, registry publication, upstream submission, and upstream
  acceptance.
- Future integration folders must have their own `AGENTS.md`, package metadata,
  upstream source reference, tests, and submission notes.

## Local Contracts

- The default conformance run is read-only except for deliberately invalid,
  authentication-gated requests that Core rejects before dispatch. It verifies
  public model discovery, online modality status, positive text context windows,
  image/video capability metadata, and the missing/invalid authentication
  boundaries without a credential.
- Account checks read `GRID_API_KEY` or an explicitly named environment
  variable. Never accept, print, persist, or place keys in command arguments.
- A real generation requires both a key and the explicit `--live-text` flag.
  Keep its prompt and output bound small and never imply one run proves uptime,
  quality, billing, privacy, or every modality.
- The cross-package production gate requires `AIPG_LIVE_E2E=1` and reads
  `AIPG_API_KEY` only from the environment. It quotes every bounded workload
  before dispatch, refuses unpriced or non-charging work, enforces a hard
  three-cent ceiling, and verifies spend moved within that ceiling without
  printing balances or generated content. Do not weaken the ceiling or add a
  workload without updating its quote and release-contract test.
- Record only structural evidence and timing. Do not persist prompts, generated
  content, account balances, worker identities, or response headers.
- Integrations must use documented `/v1` interfaces and scoped keys. Do not
  revive Horde endpoints or add provider-specific behavior to Core merely to
  satisfy a third-party framework.
- A first-party demo or passing mock is not upstream adoption. Record a merged
  upstream PR or accepted marketplace package separately.
- Pin every third-party GitHub Action to a full commit SHA in CI, packaging,
  and publication workflows. Keep the release tag in a short trailing comment.
- Publication workflows carry OIDC permission and must explicitly set
  `package-manager-cache: false`; do not restore dependency caches into a
  privileged release job.
- Publication workflows must fetch full Git history and prove the tagged
  release commit is already reachable from `origin/main` before publishing.
- Builder-credit applications must request the smallest useful `$5-$20` tier,
  fund only a public integration or demo, expire after 60 days, and promise no
  cash, token, reimbursement, or automatic eligibility. Never collect account
  IDs, API keys, login tokens, seed phrases, or wallet private keys in issues.
  The public form must explicitly acknowledge that community workers may
  inspect plaintext prompts and outputs and require non-sensitive test data.

## Verification

- `npm test`
- `npm run conformance:public`
- `npm run proof:weekly` - print a current read-only proof snapshot; pass
  `-- --output proof/YYYY-MM-DD-weekly-post.md` only when intentionally
  refreshing the dated artifact.
- `npm run check`
- `npm run verify`
- `AIPG_LIVE_E2E=1 AIPG_API_KEY="..." npm run release:e2e:live` - supervised
  four-integration production gate using a disposable `account.read` +
  `inference.submit` key; never run in default CI.
- `AIPG_API_KEY="..." npm run release:key:verify-revoked` - after revocation,
  prove the disposable key fails with `401`, then unset it from the shell.

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
- [starters/AGENTS.md](starters/AGENTS.md) - runnable Web3 application examples
  and their shared security/billing boundary.
