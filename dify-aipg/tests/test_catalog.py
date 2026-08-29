from types import SimpleNamespace

import pytest

from scripts import check_catalog


def test_catalog_discovery_is_public_and_read_only(monkeypatch):
    calls = []

    def fake_get(url, *, timeout):
        calls.append((url, timeout))
        if url.endswith("/status/models"):
            return SimpleNamespace(
                raise_for_status=lambda: None,
                json=lambda: [
                    {
                        "name": "gpt-oss-120b",
                        "type": "text",
                        "max_context_length": 60000,
                    },
                    {
                        "name": "deepseek-v4-flash-nvfp4",
                        "type": "text",
                        "max_context_length": 262144,
                    },
                    {
                        "name": "Smollm-135m",
                        "type": "text",
                        "max_context_length": 2048,
                    },
                    {
                        "name": "Krea 2 Turbo",
                        "type": "image",
                        "max_context_length": 2048,
                    },
                ],
            )
        return SimpleNamespace(
            raise_for_status=lambda: None,
            json=lambda: {
                "data": [
                    {"id": "auto"},
                    {"id": "Smollm-135m"},
                    {"id": "deepseek-v4-flash-nvfp4"},
                    {"id": "gpt-oss-120b"},
                ]
            },
        )

    monkeypatch.setattr(check_catalog.requests, "get", fake_get)

    predefined = check_catalog.predefined_models()
    client = check_catalog.client_models()
    online = check_catalog.online_text_contexts()
    check_catalog.validate_catalog(predefined, client, online)

    assert set(predefined) == client
    assert online == {
        "gpt-oss-120b": 60000,
        "deepseek-v4-flash-nvfp4": 262144,
        "Smollm-135m": 2048,
    }
    assert calls == [
        ("https://api.aipowergrid.io/v1/models", (5, 15)),
        ("https://api.aipowergrid.io/v1/status/models", (5, 15)),
    ]


def test_catalog_validation_rejects_context_drift():
    with pytest.raises(SystemExit, match="gpt-oss-120b.*60000.*32768"):
        check_catalog.validate_catalog(
            {"auto": 60000, "gpt-oss-120b": 60000},
            {"auto", "gpt-oss-120b"},
            {"gpt-oss-120b": 32768},
        )


def test_catalog_validation_does_not_require_router_worker_status():
    check_catalog.validate_catalog({"auto": 60000}, {"auto"}, {})
