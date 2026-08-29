# dify-aipg - Dify model-provider plugin

## Purpose

Native Dify provider for AI Power Grid text inference. The plugin packages the
Grid's OpenAI-compatible chat surface as named Dify LLMs without claiming that
Dify's LLM abstraction represents Grid image, video, or audio jobs.

## Ownership

- `provider/` - provider credentials, read-only validation, and Dify schema.
- `models/llm/` - OpenAI-compatible invocation adapter and predefined models.
- `_assets/` - official AIPG provider icon.
- `tests/` - credential-boundary, schema, and adapter tests.

## Local Contracts

- Production inference is fixed to `https://api.aipowergrid.io/v1`. Do not add
  a user-controlled endpoint to this branded provider; Dify already has a
  generic OpenAI-compatible provider for arbitrary hosts.
- Credential validation must remain read-only. It may call account metadata but
  must not dispatch inference, reserve credits, or print response bodies.
- The key must carry `account.read` and `inference.submit`. Keep it in Dify's
  secret credential store and never place it in examples, logs, or fixtures.
- Predefined model IDs must match the public `/v1/models` catalog. Static Dify
  prices may only mirror a reviewed Core price-book entry. Core remains the
  billing authority, especially for `auto` and models without a stable peg.
- Preserve streaming, tools, stop sequences, usage, and provider errors through
  Dify's maintained `OAICompatLargeLanguageModel` adapter.
- Media must be added as explicit Dify tools with modality-native parameters;
  do not represent media generation as an LLM.

## Verification

- `UV_CACHE_DIR=/tmp/aipg-dify-uv uv sync --dev`
- `UV_CACHE_DIR=/tmp/aipg-dify-uv uv run pytest`
- `UV_CACHE_DIR=/tmp/aipg-dify-uv uv run ruff check .`
- `UV_CACHE_DIR=/tmp/aipg-dify-uv uv run python scripts/check_catalog.py`

Packaging requires the current Dify daemon CLI and `uv` 0.12 or newer. The
CLI's dependency exporter is incompatible with the old workspace `uv` 0.5.

The catalog check is public and read-only. A real Dify generation requires a
separately approved scoped key and is not part of the default suite.

## Child DOX Index

None.
