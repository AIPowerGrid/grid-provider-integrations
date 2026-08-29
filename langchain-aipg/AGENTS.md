# langchain-aipg - LangChain cookbook

## Purpose

Runnable Python examples for using AI Power Grid text models through
LangChain's existing `ChatOpenAI` compatibility surface. This is a cookbook,
not a new LangChain provider package.

## Ownership

- `src/aipg_langchain/` - endpoint validation, public model discovery, and the
  configured `ChatOpenAI` factory.
- `examples/` - small chat, streaming, and tool-call examples.
- `tests/` - local HTTP contract tests with no paid or external inference.
- `pyproject.toml` and `uv.lock` - reproducible Python environment.
- `upstream-cookbook.mdx` - first-party hosted cookbook source; current
  LangChain policy does not make it eligible as a new hosted integration page.
- `upstream-index-entry.mdx` and `UPSTREAM_PR.md` - source-ready, one-paragraph
  compatibility proposal for LangChain's existing Chat Completions API section
  and its live-evidence gate. They are not evidence of upstream submission or
  acceptance.

## Local Contracts

- Keep `https://api.aipowergrid.io/v1` as the production default.
- API keys come from `AIPG_API_KEY` in examples. Never accept them as CLI
  arguments, print them, or write them to files.
- Environment-key fallback is allowed only for the canonical production base.
  Custom bases require an explicit `api_key`; public model discovery attaches
  no environment key unless the caller supplies one directly.
- Public model discovery must work without a key. Supplying a key is optional
  and must not change the returned catalog contract.
- Set `use_responses_api=False` explicitly. LangChain can infer Responses API
  routing from model names, which is unsafe for a custom OpenAI-compatible
  endpoint.
- Do not claim LangChain media support. This cookbook covers Grid text only.
- Tool examples use an explicitly tool-capable model. Public `/v1/models`
  currently reports modality, not a durable tool-capability contract.
- Explain that remote community workers may inspect plaintext prompts and
  outputs.
- Keep the upstream diff to the existing compatibility index. Do not propose a
  hosted provider page or independent package unless LangChain's eligibility
  policy changes or maintainers explicitly request one.

## Verification

- `uv sync --all-groups`
- `uv run pytest`
- `uv run ruff check .`
- `uv run ruff format --check .`
- `uv run python -m compileall -q src examples tests`
- `AIPG_LIVE_E2E=1 uv run pytest -q tests/test_live_e2e.py` (explicitly
  authorized disposable key only)
