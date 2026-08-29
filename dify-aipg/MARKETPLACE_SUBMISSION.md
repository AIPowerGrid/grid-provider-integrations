# Plugin Submission

## Plugin information

- **Author**: AIPowerGrid
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

Pending final credentialed Dify Community Edition and Dify Cloud checks. Do not
submit this draft until those checks pass and this sentence is replaced with
the exact commands, versions, and structural results.

## Reviewer notes

This initial package intentionally exposes text models only. AI Power Grid
image, video, and audio generation use modality-specific APIs and are not
misrepresented as Dify LLMs. Static prices mirror named-model Core rates;
`auto` remains unpriced in Dify because its selected backend can vary.

Dify's static pre-check emits three expected review warnings:

- `tiktoken` in the generated `requirements.txt` resembles a secret-field name
  to the generic scanner; it is a pinned public Python dependency.
- `requests.get` is classified as possible arbitrary network access, but the
  branded provider fixes all traffic to `https://api.aipowergrid.io` and the
  manifest allowlists only `api.aipowergrid.io`.
- The maintained `OAICompatLargeLanguageModel` wrapper receives the prepared
  credential dictionary internally. The plugin never returns or logs that
  dictionary; its `_invoke`, validation, and token-count methods return only
  the upstream adapter result.
