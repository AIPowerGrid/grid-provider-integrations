# Provider Integration Proof - 2026-08-29

AI Power Grid's current production discovery endpoint reported eleven online
model entries across text, image, video, and audio during this check. This is a
point-in-time capacity observation, not an uptime promise.

## Verified this week

- The public conformance runner passed OpenAI-compatible model discovery,
  public modality status, positive text context-window checks, image/video
  capability-metadata checks, and missing/invalid credential rejection against
  production. It observed five client-facing text IDs, eleven online model
  entries, four concrete text context windows, and six image/video capability
  declarations.
- The Vercel AI SDK provider passed 15 tests, type checking, lint, build, pack
  inspection, and a zero-vulnerability production dependency audit. Its
  scoped-key documentation now uses Core's real `account.read` scope, and an
  opt-in AI SDK 7 `streamText` production lane passed against production with
  a disposable scoped key.
- The exact AI SDK and ElizaOS release tarballs also installed and imported
  successfully from disposable clean consumers with their declared host peers.
  Both pack and install phases disable lifecycle scripts, and the consumers are
  deleted after each check. This closes the gap between source-tree tests and
  the payload developers would actually install from npm.
- The ElizaOS plugin passed 13 component tests plus a real `AgentRuntime`
  registration/invocation test, type checking, lint, build, and pack
  inspection. Its production `AgentRuntime` discovery and bounded stream lane
  also passed with `gpt-oss-120b`; the lane keeps strict rejection of truncated
  output instead of accepting a partial completion. Its publish payload
  contains no runtime dependencies. The
  current ElizaOS host core still brings one high `pdfjs-dist` advisory and
  one low `elliptic` advisory.
- The Dify provider passed 14 tests, lint, format, and a public production
  catalog check covering three curated text models and their advertised
  context windows. Dify daemon 0.6.10
  produced a 19-file runtime-only `.difypkg`; the current Marketplace toolkit
  at commit `57a21d1304b1108df3e6b90a15a4f5dd9f0915f9` passed its content,
  manifest, README, dependency, binary, OSV, domain, and PR-template checks
  with zero blocking or execution failures. The package SHA-256 is
  `6b656f2add99cd108c0dac814b8a841d51939b4e159eeeef8eea2a49ebf8b744`.
  The exact GitHub-built package installed successfully on a clean local Dify
  Community Edition 1.17.0 stack: the install task succeeded, its local runtime
  reached ready state, and Dify listed provider `aipowergrid/aipg/aipg` with
  the three curated text models. The live Grid also advertises
  `grid/qwen38-flash-next-125b-nvfp4`; that dynamic model remains outside the
  static package until its Core price and Dify metadata are reviewed.
  The exact artifact also installed in Dify Cloud, accepted a disposable
  scoped Grid key, exposed the three curated models, and completed one bounded
  production generation through `Auto Router`; the key was revoked
  immediately afterward. Credentialed Community Edition generation remains
  pending, so the package has not been submitted to the Marketplace. The final
  provenance-only [package run 33274264650](https://github.com/AIPowerGrid/grid-provider-integrations/actions/runs/33274264650)
  built this exact package on Linux and passed the pinned Marketplace toolkit.
  Its short-lived artifact contains the package, checksum, and full validator
  report; it is build evidence, not a Marketplace publication.
- The LangChain cookbook passed eleven local protocol tests through the real
  `ChatOpenAI` surface, including invocation, SSE streaming, tool-call decoding,
  public keyless model discovery, lint, format, compile, and a zero-vulnerability
  installed dependency audit. Current LangChain policy does not accept a new
  hosted guide for an unfeatured integration below 50,000 monthly downloads,
  so the staged upstream diff is one restrained link in the existing Chat
  Completions API section while the full cookbook stays first-party. Its opt-in
  production lane passed bounded invoke, streaming, forced tool calling, and
  local execution of the emitted arguments. The live pass also found that the
  production edge rejects Python's generic `urllib` user agent; discovery now
  sends the fixed non-identifying `aipg-langchain/0.1` identifier.
- The n8n node passed strict community-node lint, nine deterministic tests,
  build, pack inspection, and a zero-vulnerability production dependency
  audit. Its credential test now uses authenticated read-only credits instead
  of the public model catalog, closing a false-positive key check. n8n 2.36.8
  loaded the node and registered all four operations in a local editor smoke
  test. Its production transport then passed text, image, one-second video, and
  ten-second audio generation through the real Grid.
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
  the current official `open-webui/docs` tree. No upstream PR has been opened.
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
  ceiling before dispatch. The supervised production campaign passed all five
  integration lanes and every advertised n8n modality. Starting from an
  idempotent `$0.03` operator-canary grant, observed spend was `$0.025254`.
  The temporary five-model charging allowlist was restored to the original
  `z-image-turbo`-only policy, the disposable key was revoked, and the fixed
  revocation probe proved it returns HTTP `401`.
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
  upstream tutorial PR was not submitted as a promotional drive-by. The scope
  discussion closed without comment, so the route remains closed unless
  upstream later gives explicit permission.
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
  head `cb7295a` supports Chat Completions, Responses, and OpenAI-compatible
  image generation while preventing a server-managed AIPG credential from
  being sent to a caller-chosen API base. It publishes current image prices of
  `$0.003` for `z-image-turbo`, `$0.005` for `Krea 2 Turbo`, and `$0.01` for
  `FLUX.2 Klein 4B FP8`. Seven focused tests now execute inside LiteLLM's real
  provider shard; the prior test location passed locally but was outside that
  CI shard. The branch was merged with current upstream staging after that
  base advanced. The refreshed run passed all 77 reported checks, including
  the provider shard, lint, security, schemas, documentation, the global unit
  matrix, Codecov's patch gate, and CodSpeed. The contributor license agreement
  was accepted on August 29, 2026; ordinary maintainer review is the only
  remaining merge gate.
- LiteLLM documentation: [BerriAI/litellm-docs#1072](https://github.com/BerriAI/litellm-docs/pull/1072).
  Documentation head `2d3f36a` covers the same text and text-to-image scope,
  pricing, credential boundary, and community-worker disclosure. The full
  Docusaurus production build and writing checks pass locally; the hosted
  preview remains an upstream check.
- elizaOS registry: [elizaOS/eliza#29964](https://github.com/elizaOS/eliza/pull/29964).
  Head `8d17be009` adds the published `@aipowergrid/plugin-aipg@0.1.0`
  package to the community registry and regenerates its committed wire index.
  The upstream registry validator and generator pass. Multiple independent
  reviews approved the metadata and verified the published package; an
  upstream maintainer still controls acceptance and merge.
- Vercel AI SDK community-provider documentation:
  [vercel/ai#20003](https://github.com/vercel/ai/pull/20003). Head `22b0e4f`
  documents the published `@aipowergrid/ai-sdk-provider@0.1.0` package and its
  remote community-worker boundary. The security, agent-review, and code-owner
  checks pass. The fork cannot produce Vercel's private preview, and ordinary
  maintainer review remains the merge gate.
- LangChain documentation: [langchain-ai/docs#5770](https://github.com/langchain-ai/docs/pull/5770).
  Head `af422919` adds one restrained paragraph to the existing Chat
  Completions compatibility section. It links to the tested cookbook and
  discloses the remote community-worker plaintext boundary. All hosted checks
  pass, and the requested Python integration reviewer has been tagged;
  ordinary maintainer review remains the acceptance gate.
- Open WebUI fork documentation correction:
  [AIPowerGrid/grid-openweb-ui#1](https://github.com/AIPowerGrid/grid-openweb-ui/pull/1).
- Open WebUI documentation scope question:
  [open-webui/docs discussion #1364](https://github.com/open-webui/docs/discussions/1364).
  It was closed without comment on August 29, 2026. No tutorial PR was opened;
  the tested guide remains first-party unless upstream later invites it.

An open pull request is not adoption, endorsement, or a partnership. It becomes
an upstream integration only if that project accepts and merges it.

## Staged, not submitted

- Dify Marketplace package: the validated artifact is staged at
  [`halfaipg/dify-plugins:feat/aipg-provider`](https://github.com/halfaipg/dify-plugins/tree/feat/aipg-provider/aipowergrid/aipg)
  on commit `5f94bde`. The branch is four commits ahead of current upstream
  `main`; together they add, refresh, and correct the path of only
  `aipowergrid/aipg/aipg-0.1.0.difypkg`. The remotely validated package
  matches SHA-256
  `6b656f2add99cd108c0dac814b8a841d51939b4e159eeeef8eea2a49ebf8b744`.
  No Marketplace PR exists. The credentialed Dify Cloud check passed with this
  artifact. Credentialed Community Edition generation and the Plugin Developer
  Agreement still gate submission.
- n8n Creator Portal: `@aipowergrid/n8n-nodes-aipg@0.1.2` is published with
  npm provenance and passes n8n's community-package scanner. The submission
  record is ready, but no Creator Portal submission has been made. A creator
  account login and any emailed ownership challenge remain external gates.

## Release gates still open

- Complete the credentialed Dify Community Edition generation check before
  Marketplace submission. The direct provider and Cloud production lanes
  passed, but neither substitutes for the remaining Community Edition check.
- Submit the published n8n package through the Creator Portal. npm publication
  is complete: `@aipowergrid/ai-sdk-provider@0.1.0`,
  `@aipowergrid/plugin-aipg@0.1.0`, and
  `@aipowergrid/n8n-nodes-aipg@0.1.2` were released by GitHub Actions with
  provenance. Their npm OIDC Trusted Publishers are attached, both repository
  `NPM_TOKEN` secrets are absent, and the one-time bootstrap token is revoked.
  The AI SDK documentation and elizaOS registry entries are submitted for
  review; open submissions are not upstream acceptance.
- elizaOS should update the inherited PDF and elliptic dependency paths in its
  host core; this plugin cannot safely override peer internals.

Grid requests may be processed by remote community-operated workers. These
integrations do not provide confidential inference by themselves, and users
should not send secrets or regulated data without separately verified
confidential-compute controls.
