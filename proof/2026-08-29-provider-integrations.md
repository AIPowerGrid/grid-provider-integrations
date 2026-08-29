# Provider Integration Proof - 2026-08-29

AI Power Grid's current production discovery endpoint reported ten online
model entries across text, image, video, and audio during this check. This is a
point-in-time capacity observation, not an uptime promise.

## Verified this week

- The public conformance runner passed service discovery, public modality
  status, and missing/invalid credential rejection against production.
- The Vercel AI SDK provider passed 13 tests, type checking, lint, build, pack
  inspection, and a zero-vulnerability production dependency audit. Its
  scoped-key documentation now uses Core's real `account.read` scope, and an
  opt-in AI SDK 7 `streamText` production lane is prepared but has not been run
  without a disposable key.
- The ElizaOS plugin passed 11 component tests plus a real `AgentRuntime`
  registration/invocation test, type checking, lint, build, and pack
  inspection. Its publish payload contains no runtime dependencies. The
  current ElizaOS host core still brings one high `pdfjs-dist` advisory and
  one low `elliptic` advisory.
- The Dify provider passed nine tests, lint, format, and a public production
  catalog check covering four client-facing text models. Dify daemon 0.6.10
  produced a 20-file runtime-only `.difypkg`; the current Marketplace toolkit
  at commit `57a21d1304b1108df3e6b90a15a4f5dd9f0915f9` passed its content,
  manifest, README, dependency, binary, OSV, domain, and PR-template checks
  with zero blocking or execution failures. The package SHA-256 is
  `18c85afae228de891d03e53944a2f49b70178ffb42a4b846e3fc0fc7edf6c674`;
  an independent repeat build produced the same bytes.
  A stale Qwen catalog entry was removed before release. Credentialed Dify
  Community Edition and Cloud generation tests remain pending, so the package
  has not been submitted to the Marketplace.
- The LangChain cookbook passed eight local protocol tests through the real
  `ChatOpenAI` surface, including invocation, SSE streaming, tool-call decoding,
  public keyless model discovery, lint, format, compile, and a zero-vulnerability
  installed dependency audit. Its opt-in production lane covers bounded invoke,
  streaming, and forced tool calling but has not been run without a disposable
  key.
- The n8n node passed strict community-node lint, nine deterministic tests,
  build, pack inspection, and a zero-vulnerability production dependency
  audit. Its credential test now uses authenticated read-only credits instead
  of the public model catalog, closing a false-positive key check. n8n 2.36.8
  loaded the node and registered all four operations in a local editor smoke
  test. A provenance-only GitHub release workflow and an opt-in four-modality
  production gate are prepared but have not published or spent credit.
- Open WebUI v0.11.1 discovered current Grid text models through its standard
  OpenAI-compatible connection path. The public guide checker passed, and the
  prepared community tutorial passed Prettier plus a production build inside
  the current official `open-webui/docs` tree. No upstream PR has been opened
  before the credentialed runtime gate.
- The public integrations repository's GitHub CI passed the Node, Bun, and
  Python jobs, including the unauthenticated production conformance run.
- Source-ready release and submission contracts now cover the current active
  ElizaOS registry, Vercel AI SDK community-provider docs, LangChain chat
  integration docs, Dify Marketplace package path, and n8n Creator Portal.
  Ten deterministic root tests keep package names, versions, provenance tags,
  trust disclosures, and upstream targets aligned. Commit `43b7e5f` passed all
  three GitHub CI jobs after push.
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
  full-history secret scans passed before merge.

## Submitted upstream

- LiteLLM provider: [BerriAI/litellm#38725](https://github.com/BerriAI/litellm/pull/38725).
  All CI checks, including lint, security scans, unit shards, and benchmarks,
  were green on current head `c8a4cca` at the time of this report. The failed
  lint notification for old head `2326088` is superseded. Maintainer review
  and the contributor license agreement remain required.
- LiteLLM documentation: [BerriAI/litellm-docs#1072](https://github.com/BerriAI/litellm-docs/pull/1072).
- Open WebUI fork documentation correction:
  [AIPowerGrid/grid-openweb-ui#1](https://github.com/AIPowerGrid/grid-openweb-ui/pull/1).
- Open WebUI documentation scope question:
  [open-webui/docs discussion #1364](https://github.com/open-webui/docs/discussions/1364).
  No tutorial PR was opened; maintainer confirmation remains required under
  the current anti-promotion contribution policy.

An open pull request is not adoption, endorsement, or a partnership. It becomes
an upstream integration only if that project accepts and merges it.

## Release gates still open

- Run one bounded credentialed production check for each package path before
  marketplace or package-registry publication. These checks spend credits and
  are deliberately absent from default CI.
- Sign the LiteLLM contributor license agreement for PR 38725. This is an
  upstream administrative gate, not a code or CI failure.
- Publish the first-party packages only after their final tarballs are scanned
  and their registry names are confirmed. Provenance-only GitHub release paths
  are prepared for the AI SDK, ElizaOS, and n8n packages; no release tag has
  been created.
- ElizaOS should update the inherited PDF and elliptic dependency paths in its
  host core; this plugin cannot safely override peer internals.

Grid requests may be processed by remote community-operated workers. These
integrations do not provide confidential inference by themselves, and users
should not send secrets or regulated data without separately verified
confidential-compute controls.
