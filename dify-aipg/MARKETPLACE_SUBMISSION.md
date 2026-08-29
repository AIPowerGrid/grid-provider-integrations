# Plugin Submission

## Plugin information

- **Author ID**: aipowergrid
- **Plugin name**: aipg
- **Version**: 0.1.0
- **Source repository**: https://github.com/AIPowerGrid/grid-provider-integrations
- **Contact**: half@aipowergrid.io

## Submission type

- [x] New plugin
- [ ] Version update

## What changed

Adds AI Power Grid as a native Dify text-model provider. The plugin supports
streaming chat completions, tool calls, model parameters, usage reporting, and
read-only credential validation against the fixed production Grid API.

## Risk level

- [ ] Low risk
- [x] Medium risk
- [ ] High risk

The plugin sends prompts, conversation context, tool definitions, and tool
results to AI Power Grid for remote inference. Requests may be processed by
independently operated community workers.

## Required checks

- [x] I have read and followed the [Marketplace submission requirements](https://github.com/langgenius/dify-plugins/blob/main/docs/plugin-submission-requirements.md).
- [ ] I have read and comply with the Plugin Developer Agreement.
- [ ] I tested this plugin on Dify Community Edition and Dify Cloud, or documented any limitation below.
- [x] The package contains only files needed at runtime.
- [x] The package does not contain secrets, local credentials, `.env` files, `.git` directories, virtual environments, caches, logs, or IDE files.
- [x] The package does not contain executables or bundled binaries, or I explained why they are required below.
- [x] The plugin README includes setup steps, usage instructions, required APIs or credentials, connection requirements, and the source repository link.
- [x] The plugin includes `PRIVACY.md` or a hosted privacy policy, and `manifest.yaml` references it.
- [x] All user-facing text is primarily in English, with any localized README files following the [i18n guidance](https://docs.dify.ai/en/develop-plugin/features-and-specs/plugin-types/multilingual-readme).

## Security and privacy notes

The plugin sends user-provided model input to the fixed HTTPS endpoint
`https://api.aipowergrid.io`. Grid Core routes inference to a compatible remote
community worker. The plugin does not execute code or commands, access local
files, automate a browser, query databases, or fetch user-controlled URLs. API
keys remain in Dify's secret provider credential store.

## Local validation

Dify daemon CLI 0.6.10 produced the 19-file runtime package from the public
source. Its SHA-256 is
`6b656f2add99cd108c0dac814b8a841d51939b4e159eeeef8eea2a49ebf8b744`.
The Marketplace toolkit at commit
`57a21d1304b1108df3e6b90a15a4f5dd9f0915f9` reported zero blocking failures,
zero check-execution failures, and no known vulnerabilities across the 46
pinned lockfile dependencies. It emitted five review-warning categories,
documented below.

The provenance-only
[GitHub package run](https://github.com/AIPowerGrid/grid-provider-integrations/actions/runs/33274264650)
at source commit `68af5da` built this exact package on Linux and uploaded
artifact `9721015728` with its checksum and full validation report. The
artifact expires on 2026-09-12 and is not a Marketplace release.

The exact GitHub-built package was uploaded to a clean local Dify Community
Edition 1.17.0 deployment with signature verification disabled only for this
unsigned development package. The install task completed successfully, the
plugin runtime reached ready state, and Dify listed provider
`aipowergrid/aipg/aipg` with its three curated text models: `auto`,
`gpt-oss-120b`, and `deepseek-v4-flash-nvfp4`. This proves package
installation and discovery on Community Edition; it does not replace the
credentialed generation check.

Final credentialed Dify Community Edition and Dify Cloud generation checks
remain pending. Do not submit this draft until those checks pass and the
corresponding checkbox above is honestly checked.

## Upstream package path

The initial Marketplace PR adds the source and packaged artifact under
`aipowergrid/aipg/` in `langgenius/dify-plugins`. The plugin release version is
the top-level `version: 0.1.0` in `manifest.yaml`; `meta.version: 0.0.1` is the
manifest metadata format used by current Dify plugins and must not be mistaken
for the plugin release version.

The exact validated package is staged on
[`halfaipg/dify-plugins:feat/aipg-provider`](https://github.com/halfaipg/dify-plugins/tree/feat/aipg-provider/aipowergrid/aipg)
at commit `5f94bde`. The branch is four commits ahead of current upstream
`main`; together they add, refresh, and correct the path of only
`aipowergrid/aipg/aipg-0.1.0.difypkg`. It has no open or closed Marketplace PR.
Staging is not submission or acceptance.

## Reviewer notes

This initial package intentionally exposes text models only. AI Power Grid
image, video, and audio generation use modality-specific APIs and are not
misrepresented as Dify LLMs. Static prices mirror named-model Core rates;
`auto` remains unpriced in Dify because its selected backend can vary.
The live Grid currently also advertises
`qwen38-flash-next-125b-nvfp4`; it is intentionally not copied into this
static package until Core has a reviewed price peg and the Dify metadata is
reviewed. The catalog check reports such live additions without inventing a
price, while still failing on stale predefined IDs and context drift.

Dify's static pre-check emits five expected review-warning categories:

- `tiktoken` in the generated `requirements.txt` resembles a secret-field name
  to the generic scanner; it is a pinned public Python dependency.
- `requests.get` is classified as possible arbitrary network access, but the
  branded provider fixes all traffic to `https://api.aipowergrid.io` and the
  manifest allowlists only `api.aipowergrid.io`.
- The maintained `OAICompatLargeLanguageModel` wrapper receives the prepared
  credential dictionary internally. The plugin never returns or logs that
  dictionary; its `_invoke`, validation, and token-count methods return only
  the upstream adapter result.
- The access-domain scan finds the fixed `api.aipowergrid.io` domain and one
  runtime-built call address. The only runtime base URL is the same fixed
  constant; users cannot configure another host.
- The dependency scanner reports that it examined 46 pinned `uv.lock`
  dependencies and found no known vulnerabilities. This is informational, not
  a vulnerability finding.
