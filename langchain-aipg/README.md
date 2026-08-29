# AI Power Grid with LangChain

Use Grid text models through LangChain's existing `ChatOpenAI` compatibility
surface. This cookbook intentionally does not create another provider package:
the Grid already implements the standard Chat Completions contract LangChain
needs.

## Set up

Create a user API key at
[console.aipowergrid.io](https://console.aipowergrid.io/dashboard/api-key).
Ordinary programmatic keys carry `account.read` and `inference.submit`. Keep the
key server-side:

```bash
uv sync --all-groups
export AIPG_API_KEY='grid_...'
```

Never put this key in browser code, a mobile bundle, a notebook you will share,
or a command-line argument.

## Discover models

The client-facing text catalog changes as network capacity changes. Production
discovery is public, so listing models does not require or expose an API key:

```bash
uv run python examples/chat.py --list-models
```

The helper reads `/v1/models`, the canonical client-facing catalog. It does not
use raw worker-status records as a model allowlist.

## Chat and stream

```bash
uv run python examples/chat.py "Explain proof of stake in three sentences."
uv run python examples/chat.py --stream "Write a four-line poem about compute."
```

The client sets `use_responses_api=False` explicitly. Current LangChain can
choose the Responses API from model-name heuristics even with a custom base URL;
explicit routing prevents a future model name from changing endpoints by
accident.

The equivalent application code is small:

```python
from aipg_langchain import create_chat_model

model = create_chat_model("gpt-oss-120b", max_tokens=256)
answer = model.invoke("Explain decentralized inference briefly.")
print(answer.text)

for chunk in model.stream("Write a four-line poem."):
    print(chunk.text, end="", flush=True)
```

## Tools

`examples/tool_call.py` shows standard OpenAI function calling with
`gpt-oss-120b`. The public model list currently reports input modality, not a
stable tool-capability flag, so do not bind tools to every discovered model
blindly. Tool support can also vary with the connected backend.

```bash
uv run python examples/tool_call.py
```

## Errors and credits

LangChain surfaces errors from the underlying OpenAI Python client. Handle
`openai.AuthenticationError`, `openai.RateLimitError`, and
`openai.BadRequestError`. An HTTP `402` means the account lacks enough usable
credit for the request. Fund that same account in the
[Grid console](https://console.aipowergrid.io/dashboard/funding), then retry
with bounded backoff only where the operation is safe to repeat.

## Privacy and scope

Grid requests are routed to remote community-operated workers. Workers may be
able to inspect plaintext prompts and outputs. Do not send secrets, personal or
regulated data, or confidential source code unless a separately verified
confidential-compute deployment satisfies your requirements.

This cookbook covers text chat, streaming, and standard tool calls. It does not
claim that LangChain exposes the Grid's image, video, audio, worker, validator,
or payment APIs. It is maintained by AI Power Grid and does not imply a
partnership with LangChain.

## Verify

The tests exercise model discovery, non-streaming chat, SSE streaming, tool
schema/response handling, authentication failure, and transport safety against
a local HTTP server:

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
uv run python -m compileall -q src examples tests
```

A credentialed production run is a separate release gate because it spends
account credit. Run one bounded chat, stream, and tool call before publishing an
upstream recipe:

```bash
AIPG_LIVE_E2E=1 uv run pytest -q tests/test_live_e2e.py
```

Use a disposable key carrying only `account.read` and `inference.submit`, then
revoke it after the run. The test asserts protocol behavior without printing
the key, prompts, model output, or account balance.
