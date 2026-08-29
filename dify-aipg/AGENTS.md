# dify-aipg - Dify model-provider plugin

## Purpose

Native Dify provider for AI Power Grid text inference. The plugin packages the
Grid's OpenAI-compatible chat surface as named Dify LLMs without claiming that
Dify's LLM abstraction represents Grid image, video, or audio jobs.

## Ownership

- `provider/` - provider credentials, read-only validation, and Dify schema.
- `models/llm/` - OpenAI-compatible invocation adapter and predefined models.
- `_assets/` - official AIPG provider icon.
- `requirements.txt` - lock-derived runtime export consumed by the official
  Dify packager. Regenerate it from `uv.lock`; do not edit pins by hand.
- `tests/` - credential-boundary, schema, and adapter tests.

## Local Contracts

- Production inference is fixed to `https://api.aipowergrid.io/v1`. Do not add
  a user-controlled endpoint to this branded provider; Dify already has a
  generic OpenAI-compatible provider for arbitrary hosts.
- Credential validation must remain read-only. It may call account metadata but
  must not dispatch inference, reserve credits, or print response bodies.
- The key must carry `account.read` and `inference.submit`. Keep it in Dify's
  secret credential store and never place it in examples, logs, or fixtures.
- Predefined model IDs must match the public `/v1/models` catalog. Concrete
  model context windows must match `/v1/status/models`; `auto` is a router and
  has no worker status row. Static Dify prices may only mirror a reviewed Core
  price-book entry. Core remains the billing authority, especially for `auto`
  and models without a stable peg.
- Preserve streaming, tools, stop sequences, usage, and provider errors through
  Dify's maintained `OAICompatLargeLanguageModel` adapter.
- Media must be added as explicit Dify tools with modality-native parameters;
  do not represent media generation as an LLM.

## Verification

- `UV_CACHE_DIR=/tmp/aipg-dify-uv uv sync --dev`
- `UV_CACHE_DIR=/tmp/aipg-dify-uv uv run pytest`
- `UV_CACHE_DIR=/tmp/aipg-dify-uv uv run ruff check .`
- `UV_CACHE_DIR=/tmp/aipg-dify-uv uv run python scripts/check_catalog.py`
- `AIPG_LIVE_E2E=1 AIPG_API_KEY="..." UV_CACHE_DIR=/tmp/aipg-dify-uv uv run pytest -q tests/test_live_e2e.py`
  - supervised credential validation plus one bounded Dify-adapter stream with
    a disposable scoped key; never run in default CI.

Packaging requires the current Dify daemon CLI. The checked-in
`requirements.txt` is intentional: daemon CLI 0.6.10 otherwise invokes an
export syntax that is incompatible with the workspace `uv` 0.5. Regenerate it
from the frozen lock before packaging:

```bash
UV_CACHE_DIR=/tmp/aipg-dify-uv uv export --frozen --offline \
  --format requirements-txt --no-group dev --no-emit-project --no-hashes \
  --no-header --output-file requirements.txt
```

`.github/workflows/package-dify.yml` is provenance-only. It may build,
validate, checksum, and upload a short-lived GitHub artifact, but it must not
publish to Dify Marketplace, receive registry credentials, or imply that the
credentialed Community Edition and Cloud tests passed.

The catalog check is public and read-only. A real Dify generation requires a
separately approved scoped key and is not part of the default suite.

## Child DOX Index

None.
