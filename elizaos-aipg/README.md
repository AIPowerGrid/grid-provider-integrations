# AI Power Grid for ElizaOS

`@aipowergrid/plugin-aipg` lets an ElizaOS agent use AI Power Grid for text
reasoning and explicit image, video, and music generation.

This is an independent AI Power Grid integration. It does not imply an ElizaOS
partnership or registry acceptance.

## Install

```bash
elizaos plugins add @aipowergrid/plugin-aipg
```

Create a Grid API key in the [developer console](https://console.aipowergrid.io/dashboard/api-key)
with these scopes:

- `inference.submit` for generation
- `account.read` for model and credit status

Set the key only in the agent runtime environment:

```bash
export AIPG_API_KEY="your-key"
```

Do not put API keys in character files, prompts, source control, or action
parameters.

## Capabilities

- ElizaOS text model handlers for small, large, reasoning, and completion calls
- SSE text streaming with bounded timeouts and explicit incomplete-stream errors
- ElizaOS `IMAGE` model handler
- Explicit `AIPG_CHAT`, `AIPG_GENERATE_IMAGE`, `AIPG_GENERATE_VIDEO`, and
  `AIPG_GENERATE_AUDIO` actions
- Read-only `AIPG_LIST_MODELS` and `AIPG_CREDIT_STATUS` actions
- Online model discovery before generation

The plugin defaults to Grid's `auto` text route. A character or runtime can pin
text models with `AIPG_TEXT_SMALL_MODEL`, `AIPG_TEXT_LARGE_MODEL`,
`AIPG_REASONING_MODEL`, and `AIPG_COMPLETION_MODEL`. Media actions accept a
model selected from the live model list.

## Trust And Billing

Requests leave the ElizaOS runtime and are dispatched by Grid Core to remote,
community-operated workers. Do not send secrets or assume confidential
inference. Grid credits are billed under the account attached to the API key;
the plugin never generates during initialization or credential validation.

The current source of truth for availability is `GET /v1/models` and the source
of truth for account credits is `GET /v1/account/credits`. A model being listed
means at least one compatible worker is currently connected; it is not an SLA.

## Development

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint:check
bun test
bun run build
bun audit --production
npm pack --dry-run
```

Mock tests never use a real key or spend credits. Before a release, run one
supervised, low-output text generation through the real ElizaOS runtime with a
dedicated scoped test key:

```bash
AIPG_API_KEY="..." bun run test:e2e:live
```

Record only status/timing evidence, never the key, prompt, output, or balance.

The stable `@elizaos/core` development tree currently reports advisories in its
own PDF/crypto transitive dependencies under a full `bun audit`. They are not
bundled by this package (`@elizaos/core` is a peer), but the upstream findings
must remain visible in release notes until ElizaOS updates them.

Publish only through the root `publish-packages.yml` workflow after the live
gate, using a tag that exactly matches the package version, such as
`plugin-aipg-v0.1.0`. Configure npm Trusted Publishing for the
`AIPowerGrid/grid-provider-integrations` repository and that workflow; use a
package-scoped `NPM_TOKEN` only if npm requires one for the first publication.
