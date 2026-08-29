"""Configure LangChain for AI Power Grid's OpenAI-compatible text API."""

from __future__ import annotations

import json
import os
from collections.abc import Sequence
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

from langchain_openai import ChatOpenAI
from openai import DefaultAsyncHttpxClient, DefaultHttpxClient
from pydantic import SecretStr

AIPG_API_BASE = "https://api.aipowergrid.io/v1"
_LOOPBACK_HOSTS = frozenset({"127.0.0.1", "::1", "localhost"})


class MissingAPIKeyError(RuntimeError):
    """Raised when no server-side Grid key is configured."""


class ModelDiscoveryError(RuntimeError):
    """Raised when the public model catalog has an invalid shape."""


class _NoRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, *_args: object, **_kwargs: object) -> None:
        return None


def _resolved_api_key(api_key: SecretStr | None) -> SecretStr:
    resolved_key = api_key or SecretStr(os.environ.get("AIPG_API_KEY", ""))
    if not resolved_key.get_secret_value():
        raise MissingAPIKeyError("Set AIPG_API_KEY to a scoped Grid inference key")
    return resolved_key


def _validated_base_url(base_url: str) -> str:
    parsed = urlparse(base_url)
    is_loopback_http = parsed.scheme == "http" and parsed.hostname in _LOOPBACK_HOSTS
    if parsed.scheme != "https" and not is_loopback_http:
        raise ValueError("AIPG base URL must use HTTPS; plain HTTP is allowed only on loopback")
    if parsed.username or parsed.password or not parsed.hostname:
        raise ValueError("AIPG base URL must not contain credentials and must include a host")
    return base_url.rstrip("/")


def list_text_models(
    *,
    api_key: SecretStr | None = None,
    base_url: str = AIPG_API_BASE,
    timeout: float = 20.0,
) -> tuple[str, ...]:
    """Return model IDs from the Grid's canonical client-facing text catalog.

    Args:
        api_key: Optional Grid key. Public production discovery does not require one.
        base_url: Grid API root. Plain HTTP is accepted only for loopback tests.
        timeout: Discovery request timeout in seconds.

    Returns:
        Model IDs in the order published by the Grid.

    Raises:
        ModelDiscoveryError: The response does not match the OpenAI model-list shape.
        ValueError: The base URL is unsafe.
    """
    url = f"{_validated_base_url(base_url)}/models"
    headers = {
        "Accept": "application/json",
        "User-Agent": "aipg-langchain/0.1",
    }
    if api_key is not None:
        headers["Authorization"] = f"Bearer {api_key.get_secret_value()}"
    request = Request(  # noqa: S310
        url,
        headers=headers,
    )
    with build_opener(_NoRedirectHandler).open(request, timeout=timeout) as response:
        payload = json.load(response)

    if not isinstance(payload, dict) or payload.get("object") != "list":
        raise ModelDiscoveryError("Grid model catalog is not an OpenAI model list")
    rows = payload.get("data")
    if not isinstance(rows, list):
        raise ModelDiscoveryError("Grid model catalog is missing data")

    model_ids: list[str] = []
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("id"), str):
            raise ModelDiscoveryError("Grid model catalog contains an invalid model row")
        modalities = row.get("input_modalities", [])
        if isinstance(modalities, Sequence) and "text" in modalities:
            model_ids.append(row["id"])
    return tuple(model_ids)


def create_chat_model(
    model: str = "gpt-oss-120b",
    *,
    api_key: SecretStr | None = None,
    base_url: str = AIPG_API_BASE,
    max_tokens: int = 512,
    timeout: float = 120.0,
) -> ChatOpenAI:
    """Create a `ChatOpenAI` client fixed to the Grid's Chat Completions path.

    Args:
        model: A model ID returned by `list_text_models`.
        api_key: Scoped Grid key. Defaults to `AIPG_API_KEY`.
        base_url: Grid API root. Plain HTTP is accepted only for loopback tests.
        max_tokens: Maximum completion tokens per call.
        timeout: Request timeout in seconds.

    Returns:
        Configured LangChain chat model.

    Raises:
        MissingAPIKeyError: No key is available.
        ValueError: The model, bounds, or base URL is invalid.
    """
    validated_base_url = _validated_base_url(base_url)
    if validated_base_url != AIPG_API_BASE and api_key is None:
        raise ValueError("A custom AIPG base URL requires an explicit api_key")
    resolved_key = _resolved_api_key(api_key)
    if not model or not model.strip():
        raise ValueError("model must not be empty")
    if max_tokens < 1:
        raise ValueError("max_tokens must be positive")

    return ChatOpenAI(
        model=model,
        api_key=resolved_key,
        base_url=validated_base_url,
        use_responses_api=False,
        max_tokens=max_tokens,
        timeout=timeout,
        max_retries=2,
        stream_usage=False,
        http_client=DefaultHttpxClient(follow_redirects=False),
        http_async_client=DefaultAsyncHttpxClient(follow_redirects=False),
    )
