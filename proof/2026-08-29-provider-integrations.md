# Provider Integration Proof - 2026-08-29

AI Power Grid's current production discovery endpoint reported ten online
model entries across text, image, video, and audio during this check. This is a
point-in-time capacity observation, not an uptime promise.

## Verified this week

- The public conformance runner passed service discovery, public modality
  status, and missing/invalid credential rejection against production.
- The Vercel AI SDK provider passed 13 tests, type checking, lint, build, pack
  inspection, and a zero-vulnerability production dependency audit.
- The ElizaOS plugin passed 11 component tests plus a real `AgentRuntime`
  registration/invocation test, type checking, lint, build, and pack
  inspection. Its publish payload contains no runtime dependencies. The
  current ElizaOS host core still brings one high `pdfjs-dist` advisory and
  one low `elliptic` advisory.
- The Dify provider passed eight tests and lint, and its installed Python
  dependency audit found no known vulnerabilities. A stale Qwen catalog entry
  was removed before release.
- The LangChain cookbook passed eight local protocol tests, lint, format,
  compile, and a zero-vulnerability installed dependency audit.
- The n8n node passed strict community-node lint, seven tests, build, pack
  inspection, and a zero-vulnerability production dependency audit. n8n
  2.36.8 loaded the node and registered all four operations in a local editor
  smoke test.
- Open WebUI v0.11.1 discovered current Grid text models through its standard
  OpenAI-compatible connection path. The public guide checker passed.
- The public integrations repository's GitHub CI passed the Node, Bun, and
  Python jobs, including the unauthenticated production conformance run.
- Grid Core merged normalization for current clients that send
  `max_completion_tokens`, preventing the field from bypassing the metered
  generation cap: [AIPowerGrid/grid-core#63](https://github.com/AIPowerGrid/grid-core/pull/63).

## Submitted upstream

- LiteLLM provider: [BerriAI/litellm#38725](https://github.com/BerriAI/litellm/pull/38725).
  All CI checks, including lint, security scans, unit shards, and benchmarks,
  were green at the time of this report; maintainer review remained required.
- LiteLLM documentation: [BerriAI/litellm-docs#1072](https://github.com/BerriAI/litellm-docs/pull/1072).
- Open WebUI fork documentation correction:
  [AIPowerGrid/grid-openweb-ui#1](https://github.com/AIPowerGrid/grid-openweb-ui/pull/1).
- Marketing capability-claim correction:
  [halfaipg/aipg-website#16](https://github.com/halfaipg/aipg-website/pull/16).

An open pull request is not adoption, endorsement, or a partnership. It becomes
an upstream integration only if that project accepts and merges it.

## Release gates still open

- Run one bounded credentialed production check for each package path before
  marketplace or package-registry publication. These checks spend credits and
  are deliberately absent from default CI.
- Publish the first-party packages only after their final tarballs are scanned
  and their registry names are confirmed.
- ElizaOS should update the inherited PDF and elliptic dependency paths in its
  host core; this plugin cannot safely override peer internals.

Grid requests may be processed by remote community-operated workers. These
integrations do not provide confidential inference by themselves, and users
should not send secrets or regulated data without separately verified
confidential-compute controls.
