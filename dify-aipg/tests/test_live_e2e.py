"""Opt-in production proof through Dify's maintained compatibility adapter."""

from __future__ import annotations

import os

import pytest
from dify_plugin.entities.model.message import UserPromptMessage

from models.llm.llm import AIPGLargeLanguageModel
from provider.aipg import AIPGProvider

pytestmark = pytest.mark.live


@pytest.mark.skipif(
    os.environ.get("AIPG_LIVE_E2E") != "1",
    reason="set AIPG_LIVE_E2E=1 with a disposable inference key",
)
def test_live_dify_validation_and_stream() -> None:
    api_key = os.environ.get("AIPG_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("AIPG_API_KEY is required for the explicit live E2E lane")
    model = os.environ.get("AIPG_E2E_SMALL_MODEL", "deepseek-v4-flash-nvfp4")
    credentials = {"api_key": api_key}

    provider = object.__new__(AIPGProvider)
    provider.validate_provider_credentials(credentials)

    llm = AIPGLargeLanguageModel([])
    chunks = list(
        llm._invoke(
            model=model,
            credentials=credentials,
            prompt_messages=[UserPromptMessage(content="Reply with one short word.")],
            model_parameters={"max_tokens": 8},
            stream=True,
        )
    )
    content = "".join(
        chunk.delta.message.content
        for chunk in chunks
        if isinstance(chunk.delta.message.content, str)
    ).strip()
    assert content, "Dify adapter stream contained no generated text"

    terminal = chunks[-1].delta
    assert terminal.finish_reason, "Dify adapter stream had no terminal finish reason"
    assert terminal.usage is not None, "Dify adapter stream had no terminal usage"
    assert terminal.usage.total_tokens > 0
    assert terminal.usage.completion_tokens > 0
