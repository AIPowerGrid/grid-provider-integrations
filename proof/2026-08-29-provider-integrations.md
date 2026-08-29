# Provider Integration Proof - 2026-08-29

AI Power Grid's current production discovery endpoint reported ten online
model entries across text, image, video, and audio during this check. This is a
point-in-time capacity observation, not an uptime promise.

## Verified this week

- The public conformance runner passed OpenAI-compatible model discovery,
  public modality status, positive text context-window checks, image/video
  capability-metadata checks, and missing/invalid credential rejection against
  production. It observed four client-facing text IDs, ten online model
  entries, three concrete text context windows, and six image/video capability
  declarations.
- The Vercel AI SDK provider passed 15 tests, type checking, lint, build, pack
  inspection, and a zero-vulnerability production dependency audit. Its
  scoped-key documentation now uses Core's real `account.read` scope, and an
  opt-in AI SDK 7 `streamText` production lane is prepared but has not been run
  without a disposable key.
- The exact AI SDK and ElizaOS release tarballs also installed and imported
  successfully from disposable clean consumers with their declared host peers.
  Both pack and install phases disable lifecycle scripts, and the consumers are
  deleted after each check. This closes the gap between source-tree tests and
  the payload developers would actually install from npm.
- The ElizaOS plugin passed 13 component tests plus a real `AgentRuntime`
  registration/invocation test, type checking, lint, build, and pack
  inspection. Its publish payload contains no runtime dependencies. The
  current ElizaOS host core still brings one high `pdfjs-dist` advisory and
  one low `elliptic` advisory.
- The Dify provider passed 14 tests, lint, format, and a public production
  catalog check covering four curated text models and their advertised
  context windows. Dify daemon 0.6.10
  produced a 20-file runtime-only `.difypkg`; the current Marketplace toolkit
  at commit `57a21d1304b1108df3e6b90a15a4f5dd9f0915f9` passed its content,
  manifest, README, dependency, binary, OSV, domain, and PR-template checks
  with zero blocking or execution failures. The package SHA-256 is
  `88c54550bc333fb55c68c9b5a3ea3c8f509368235c5333fc7059c7950d351190`.
  The exact GitHub-built package installed successfully on a clean local Dify
  Community Edition 1.17.0 stack: the install task succeeded, its local runtime
  reached ready state, and Dify listed provider `aipowergrid/aipg/aipg` with
  the four curated text models. The live Grid also advertises
  `grid/qwen38-flash-next-125b-nvfp4`; that dynamic model remains outside the
  static package until its Core price and Dify metadata are reviewed.
  Credentialed Community Edition and Cloud generation tests remain pending, so
  the package has not been submitted to the Marketplace. Packaging hardening commits
  `d789ce1` and `ab57272` passed the repository's Node, Python, and ElizaOS
  GitHub jobs in [CI run 33231584103](https://github.com/AIPowerGrid/grid-provider-integrations/actions/runs/33231584103);
  the earlier `d789ce1` run is superseded because its byte-for-byte comparison
  treated version-dependent `uv` annotations as dependency changes.
  Current runtime-package commit `2518636` built the exact package on Linux and passed the
  pinned Marketplace toolkit in
  [run 33238108393](https://github.com/AIPowerGrid/grid-provider-integrations/actions/runs/33238108393).
  Artifact `9710523103` contains the package, checksum, and full validator
  report and expires on 2026-09-12; it is build evidence, not a Marketplace
  publication.
- The LangChain cookbook passed eleven local protocol tests through the real
  `ChatOpenAI` surface, including invocation, SSE streaming, tool-call decoding,
  public keyless model discovery, lint, format, compile, and a zero-vulnerability
  installed dependency audit. Current LangChain policy does not accept a new
  hosted guide for an unfeatured integration below 50,000 monthly downloads,
  so the staged upstream diff is one restrained link in the existing Chat
  Completions API section while the full cookbook stays first-party. Its opt-in
  production lane covers bounded invoke, streaming, and forced tool calling but
  has not been run without a disposable key.
- The n8n node passed strict community-node lint, nine deterministic tests,
  build, pack inspection, and a zero-vulnerability production dependency
  audit. Its credential test now uses authenticated read-only credits instead
  of the public model catalog, closing a false-positive key check. n8n 2.36.8
  loaded the node and registered all four operations in a local editor smoke
  test. A provenance-only GitHub release workflow and an opt-in four-modality
  production gate are prepared but have not published or spent credit.
- A cross-provider credential-destination audit closed environment-key
  forwarding and redirect gaps before package release. AI SDK and LangChain
  environment credentials are now eligible only for the canonical Grid origin;
  custom test bases require explicit credentials. AI SDK and ElizaOS redact an
  echoed key from bounded upstream errors, ElizaOS rejects plaintext remote
  bases, and authenticated Dify, ElizaOS, AI SDK, LangChain, and n8n transports
  refuse redirects. These are release-boundary controls, not claims that a
  third-party host is trusted merely because a caller supplied it explicitly.
- Privileged npm publication jobs now explicitly disable `setup-node` package
  caches, while ordinary read-only CI retains its lock-keyed cache. A root
  release-contract test fails if any publish job re-enables npm, yarn, or pnpm
  caching or omits the explicit cache-disable setting.
- Open WebUI v0.11.1 discovered the current Grid text-model set through its standard
  OpenAI-compatible connection path. The public guide checker passed, and the
  prepared community tutorial passed Prettier plus a production build inside
  the current official `open-webui/docs` tree. No upstream PR has been opened
  before the credentialed runtime gate.
- First-party integration guidance is now published at
  [aipowergrid.io/docs/integrations](https://aipowergrid.io/docs/integrations)
  through [AIPowerGrid/aipg-documentation#13](https://github.com/AIPowerGrid/aipg-documentation/pull/13).
  It gives usable Open WebUI and LangChain configuration while labeling every
  native package by its actual publication or review state. The protected docs
  PR passed both secret gates, merged, built on Vercel, and the production route
  was verified with HTTP 200 and the expected content.
- The public integrations repository's GitHub CI passed the Node, Bun, and
  Python jobs, including the unauthenticated production conformance run. A
  new supervised release command now preflights ten fixed Dify, AI SDK,
  ElizaOS, LangChain, and n8n workloads against Core's canonical quote API,
  requires active charging and sufficient credit, and enforces a hard `$0.03`
  ceiling before dispatch. The gate itself has not been run without an
  explicitly approved disposable key.
- Weekly proof copy is now generated from the public network-status, job-total,
  and payout APIs instead of hand-maintained arithmetic. The generator rejects
  unknown status schemas and economically active validator states, and it
  explicitly withholds paid-demand, external-builder, independent-worker, and
  historical-uptime claims when the public APIs cannot prove them. Its first
  regenerated snapshot passed 21 root tests and the complete local integration
  verification suite.
- Source-ready release and submission contracts now cover the current active
  ElizaOS registry, Vercel AI SDK community-provider docs, LangChain chat
  integration docs, Dify Marketplace package path, and n8n Creator Portal.
  Eighteen deterministic root tests keep package names, versions, provenance tags,
  trust disclosures, and upstream targets aligned. Commit `43b7e5f` passed all
  three GitHub CI jobs after push. Capability enforcement and live metadata
  drift checks then passed all three jobs at commit `5b9218d` in
  [CI run 33232941595](https://github.com/AIPowerGrid/grid-provider-integrations/actions/runs/33232941595).
  Every third-party action in CI, packaging, and publication workflows is now
  pinned to a full commit SHA, with a regression test preventing mutable action
  tags from returning before any npm release. The pinned-action and expanded
  release-contract checks passed all three jobs at commit `4577310` in
  [CI run 33233661192](https://github.com/AIPowerGrid/grid-provider-integrations/actions/runs/33233661192).
  The bounded release gate, its fail-closed quote checks, Dify adapter lane,
  and child-test anti-drift checks passed all three jobs at commit `51c5b9b` in
  [CI run 33235265633](https://github.com/AIPowerGrid/grid-provider-integrations/actions/runs/33235265633).
- The current Open WebUI contribution template rejects provider-listing
  submissions. The AIPG guide remains tested first-party documentation; an
  upstream tutorial PR is gated on explicit maintainer confirmation rather
  than being submitted as a promotional drive-by.
- Grid Core merged normalization for current clients that send
  `max_completion_tokens`, preventing the field from bypassing the metered
  generation cap: [AIPowerGrid/grid-core#63](https://github.com/AIPowerGrid/grid-core/pull/63).
- The public website capability correction was merged and deployed from
  [halfaipg/aipg-website#16](https://github.com/halfaipg/aipg-website/pull/16).
  Production now distinguishes current coordinated Core, AIPG worker payouts,
  daily allowances, and community inference from planned worker-claim,
  multi-asset, partner-node, and confidential-compute capabilities. The
  production build, eight browser smokes, dependency audit, and source plus
  full-history secret scans passed before merge. The deployed homepage and
  `/run` page were rechecked after merge and still carry those boundaries.

## Submitted upstream

- LiteLLM provider: [BerriAI/litellm#38725](https://github.com/BerriAI/litellm/pull/38725).
  The failed lint notification for old head `2326088` is superseded. Current
  head `5cbe37e` supports Chat Completions, Responses, and OpenAI-compatible
  image generation while preventing a server-managed AIPG credential from
  being sent to a caller-chosen API base. It publishes current image prices of
  `$0.003` for `z-image-turbo`, `$0.005` for `Krea 2 Turbo`, and `$0.01` for
  `FLUX.2 Klein 4B FP8`. Seven focused tests now execute inside LiteLLM's real
  provider shard; the prior test location passed locally but was outside that
  CI shard. The replacement run passed the provider shard, lint, security,
  schemas, documentation, global unit matrix, and Codecov's patch gate at
  `100%` (16/16 executable diff lines). The long CodSpeed benchmark also
  passed. Maintainer review and the contributor license agreement remain open.
- LiteLLM documentation: [BerriAI/litellm-docs#1072](https://github.com/BerriAI/litellm-docs/pull/1072).
  Documentation head `2d3f36a` covers the same text and text-to-image scope,
  pricing, credential boundary, and community-worker disclosure. The full
  Docusaurus production build and writing checks pass locally; the hosted
  preview remains an upstream check.
- Open WebUI fork documentation correction:
  [AIPowerGrid/grid-openweb-ui#1](https://github.com/AIPowerGrid/grid-openweb-ui/pull/1).
- Open WebUI documentation scope question:
  [open-webui/docs discussion #1364](https://github.com/open-webui/docs/discussions/1364).
  No tutorial PR was opened; maintainer confirmation remains required under
  the current anti-promotion contribution policy.

An open pull request is not adoption, endorsement, or a partnership. It becomes
an upstream integration only if that project accepts and merges it.

## Staged, not submitted

- Dify Marketplace package: the validated artifact is staged at
  [`halfaipg/dify-plugins:feat/aipg-provider`](https://github.com/halfaipg/dify-plugins/tree/feat/aipg-provider/aipowergrid/aipg)
  on commit `5f94bde`. The branch is four commits ahead of current upstream
  `main`; together they add, refresh, and correct the path of only
  `aipowergrid/aipg/aipg-0.1.0.difypkg`. The remotely validated package
  matches SHA-256
  `88c54550bc333fb55c68c9b5a3ea3c8f509368235c5333fc7059c7950d351190`.
  No Marketplace PR exists. Credentialed Dify Community Edition and Cloud
  checks plus the Plugin Developer Agreement still gate submission.

## Release gates still open

- Run the bounded credentialed production gate, then complete the separate
  Dify Community Edition and Cloud installation checks before marketplace or
  package-registry publication. These checks spend credits and are deliberately
  absent from default CI.
- Sign the LiteLLM contributor license agreement for PR 38725. This is an
  upstream administrative gate, not a code or CI failure.
- Publish the first-party packages only after their final tarballs are scanned
  and their registry names are confirmed. The names are available and the
  inspected tarballs contain only their intended compiled payloads, docs,
  licenses, icons, and metadata. The serialized GitHub release paths pin the
  npm registry and produce provenance, but the unpublished packages still need
  a one-time short-lived `NPM_TOKEN` bootstrap before their Trusted Publishers
  can be attached and the token removed. No release tag has been created.
- ElizaOS should update the inherited PDF and elliptic dependency paths in its
  host core; this plugin cannot safely override peer internals.

Grid requests may be processed by remote community-operated workers. These
integrations do not provide confidential inference by themselves, and users
should not send secrets or regulated data without separately verified
confidential-compute controls.
