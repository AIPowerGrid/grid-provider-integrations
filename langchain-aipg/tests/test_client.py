"""Local HTTP contract tests for the LangChain cookbook."""

from __future__ import annotations

import json
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

import openai
import pytest
from pydantic import SecretStr

from aipg_langchain import MissingAPIKeyError, create_chat_model, list_text_models


class _State:
    requests: list[dict[str, Any]]
    catalog_authorization: str | None

    def __init__(self) -> None:
        self.requests = []
        self.catalog_authorization = None


@contextmanager
def _grid_server() -> Iterator[tuple[str, _State]]:
    state = _State()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, _format: str, *_args: object) -> None:
            return

        def _json(self, status: int, payload: dict[str, Any]) -> None:
            body = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:
            if self.path != "/v1/models":
                self._json(404, {"detail": "not found"})
                return
            state.catalog_authorization = self.headers.get("Authorization")
            self._json(
                200,
                {
                    "object": "list",
                    "data": [
                        {"id": "auto", "object": "model", "input_modalities": ["text"]},
                        {"id": "image-only", "object": "model", "input_modalities": ["image"]},
                        {"id": "gpt-oss-120b", "object": "model", "input_modalities": ["text"]},
                    ],
                },
            )

        def do_POST(self) -> None:
            if self.path != "/v1/chat/completions":
                self._json(404, {"detail": "not found"})
                return
            if self.headers.get("Authorization") != "Bearer grid_test":
                self._json(401, {"detail": "Invalid API key"})
                return

            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
            state.requests.append(payload)
            if payload.get("stream"):
                chunks = [
                    {
                        "id": "chatcmpl-test",
                        "object": "chat.completion.chunk",
                        "created": 1,
                        "model": payload["model"],
                        "choices": [
                            {
                                "index": 0,
                                "delta": {"role": "assistant", "content": "hello"},
                                "finish_reason": None,
                            }
                        ],
                    },
                    {
                        "id": "chatcmpl-test",
                        "object": "chat.completion.chunk",
                        "created": 1,
                        "model": payload["model"],
                        "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
                    },
                ]
                body = (
                    "".join(f"data: {json.dumps(chunk)}\n\n" for chunk in chunks)
                    + "data: [DONE]\n\n"
                )
                encoded = body.encode()
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Content-Length", str(len(encoded)))
                self.end_headers()
                self.wfile.write(encoded)
                return

            if payload.get("tools"):
                message: dict[str, Any] = {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {
                            "id": "call_test",
                            "type": "function",
                            "function": {"name": "multiply", "arguments": '{"left":17,"right":23}'},
                        }
                    ],
                }
            else:
                message = {"role": "assistant", "content": "hello"}
            self._json(
                200,
                {
                    "id": "chatcmpl-test",
                    "object": "chat.completion",
                    "created": 1,
                    "model": payload["model"],
                    "choices": [{"index": 0, "message": message, "finish_reason": "stop"}],
                    "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
                },
            )

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        host, port = server.server_address
        yield f"http://{host}:{port}/v1", state
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


def _model(base_url: str, *, api_key: str = "grid_test"):
    return create_chat_model(
        api_key=SecretStr(api_key),
        base_url=base_url,
        max_tokens=32,
    )


def test_requires_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("AIPG_API_KEY", raising=False)
    with pytest.raises(MissingAPIKeyError):
        create_chat_model()


def test_rejects_insecure_remote_base() -> None:
    with pytest.raises(ValueError, match="HTTPS"):
        create_chat_model(api_key=SecretStr("grid_test"), base_url="http://example.com/v1")


def test_discovers_only_text_models_without_a_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("AIPG_API_KEY", raising=False)
    with _grid_server() as (base_url, state):
        assert list_text_models(base_url=base_url) == (
            "auto",
            "gpt-oss-120b",
        )
    assert state.catalog_authorization is None


def test_model_discovery_uses_key_when_supplied() -> None:
    with _grid_server() as (base_url, state):
        list_text_models(api_key=SecretStr("grid_test"), base_url=base_url)
    assert state.catalog_authorization == "Bearer grid_test"


def test_invokes_chat_completions() -> None:
    with _grid_server() as (base_url, state):
        response = _model(base_url).invoke("Say hello")
    assert response.text == "hello"
    assert state.requests[0]["model"] == "gpt-oss-120b"
    assert state.requests[0]["max_completion_tokens"] == 32


def test_streams_chat_completions() -> None:
    with _grid_server() as (base_url, state):
        text = "".join(chunk.text for chunk in _model(base_url).stream("Say hello"))
    assert text == "hello"
    assert state.requests[0]["stream"] is True


def test_binds_standard_openai_tool() -> None:
    def multiply(left: int, right: int) -> int:
        """Multiply two integers."""
        return left * right

    with _grid_server() as (base_url, state):
        response = _model(base_url).bind_tools([multiply]).invoke("What is 17 times 23?")
    assert response.tool_calls == [
        {
            "name": "multiply",
            "args": {"left": 17, "right": 23},
            "id": "call_test",
            "type": "tool_call",
        }
    ]
    assert state.requests[0]["tools"][0]["function"]["name"] == "multiply"


def test_maps_authentication_error() -> None:
    with _grid_server() as (base_url, _state), pytest.raises(openai.AuthenticationError):
        _model(base_url, api_key="wrong").invoke("hello")
