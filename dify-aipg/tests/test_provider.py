from types import SimpleNamespace

import pytest
from dify_plugin.errors.model import CredentialsValidateFailedError

from models.llm.llm import AIPGLargeLanguageModel, API_BASE_URL
from provider.aipg import AIPGProvider


def provider() -> AIPGProvider:
    return object.__new__(AIPGProvider)


def test_prepared_credentials_are_fixed_and_do_not_mutate_input():
    source = {"api_key": "grid_test", "endpoint_url": "http://attacker.invalid"}

    prepared = AIPGLargeLanguageModel._prepared_credentials(source)

    assert prepared["endpoint_url"] == API_BASE_URL
    assert prepared["function_calling_type"] == "tool_call"
    assert source["endpoint_url"] == "http://attacker.invalid"


def test_provider_validation_is_read_only(monkeypatch):
    calls = []

    def fake_get(url, *, headers, timeout):
        calls.append((url, headers, timeout))
        return SimpleNamespace(status_code=200)

    monkeypatch.setattr("provider.aipg.requests.get", fake_get)

    provider().validate_provider_credentials({"api_key": " grid_test "})

    assert calls == [
        (
            "https://api.aipowergrid.io/v1/account/credits",
            {"Authorization": "Bearer grid_test"},
            (5, 15),
        )
    ]


@pytest.mark.parametrize("status", [401, 403])
def test_provider_rejects_invalid_or_unscoped_key_without_echoing_body(monkeypatch, status):
    monkeypatch.setattr(
        "provider.aipg.requests.get",
        lambda *args, **kwargs: SimpleNamespace(
            status_code=status,
            text="secret upstream response",
        ),
    )

    with pytest.raises(CredentialsValidateFailedError) as exc_info:
        provider().validate_provider_credentials({"api_key": "grid_test"})

    assert "secret upstream response" not in str(exc_info.value)


def test_provider_requires_key_without_making_request(monkeypatch):
    def unexpected(*args, **kwargs):
        raise AssertionError("network request should not happen")

    monkeypatch.setattr("provider.aipg.requests.get", unexpected)

    with pytest.raises(CredentialsValidateFailedError):
        provider().validate_provider_credentials({})
