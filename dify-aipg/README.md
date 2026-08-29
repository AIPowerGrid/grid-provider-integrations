# AI Power Grid for Dify

Use community-operated AI Power Grid text workers as a native Dify model
provider. The plugin supports Dify chat workflows, streaming responses, tool
calls, usage reporting, and the Grid's client-facing model IDs through its maintained
OpenAI-compatible adapter.

Source: [AIPowerGrid/grid-provider-integrations](https://github.com/AIPowerGrid/grid-provider-integrations)

## Configure

1. Sign in at [console.aipowergrid.io](https://console.aipowergrid.io/).
2. Create an API key with `account.read` and `inference.submit` scopes.
3. Install this plugin in Dify and enter the key in the provider settings.
4. Select `auto` or a named Grid text model.

Credential validation reads the account credit summary. It does not submit a
generation or spend credits. Inference is remote and may be processed by a
community-operated worker; do not send secrets or regulated data unless the
selected service tier explicitly provides the controls you require.

## Billing

Core authorizes and settles every request against the canonical Grid credit
balance. Dify's static token-price display mirrors reviewed Core rates where a
stable named-model price exists. `auto` can route across models and therefore
does not have one honest static price. The Console and Grid quote endpoint are
the billing authority.

## Scope

This first marketplace package is an LLM provider. Grid image, video, and audio
jobs use different request contracts and will be exposed later as explicit
Dify tools rather than pretending they are chat models.

## Development

```bash
UV_CACHE_DIR=/tmp/aipg-dify-uv uv sync --dev
UV_CACHE_DIR=/tmp/aipg-dify-uv uv run pytest
UV_CACHE_DIR=/tmp/aipg-dify-uv uv run ruff check .
UV_CACHE_DIR=/tmp/aipg-dify-uv uv run python scripts/check_catalog.py
```

The test suite uses fakes. The catalog check reads the authenticated client
model list and requires `AIPG_API_KEY`. Packaging with Dify daemon CLI 0.6.10 requires
`uv` 0.12 or newer.
