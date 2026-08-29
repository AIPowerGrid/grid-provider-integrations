"""Opt-in, bounded production checks through LangChain's public API."""

from __future__ import annotations

import os

import pytest
from langchain_core.tools import tool

from aipg_langchain import create_chat_model, list_text_models

pytestmark = pytest.mark.skipif(
    os.environ.get("AIPG_LIVE_E2E") != "1",
    reason="set AIPG_LIVE_E2E=1 with a disposable inference key",
)


def _model():
    return create_chat_model("gpt-oss-120b", max_tokens=24, timeout=90)


def test_live_langchain_invoke_stream_and_tool_call() -> None:
    """Prove the three advertised LangChain paths without exposing model content."""
    assert "gpt-oss-120b" in list_text_models()

    answer = _model().invoke("Reply with the single word ready.")
    assert answer.text.strip()

    chunks = list(_model().stream("Reply with the single word streaming."))
    assert chunks
    assert any(chunk.text for chunk in chunks)

    @tool
    def multiply(left: int, right: int) -> int:
        """Multiply two integers."""
        return left * right

    result = (
        _model()
        .bind_tools([multiply], tool_choice=multiply.name)
        .invoke("Use the supplied tool to multiply 17 by 23.")
    )
    assert result.tool_calls
    assert result.tool_calls[0]["name"] == multiply.name
    assert multiply.invoke(result.tool_calls[0]) == 391
