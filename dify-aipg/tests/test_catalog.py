from types import SimpleNamespace

from scripts import check_catalog


def test_catalog_discovery_is_public_and_read_only(monkeypatch):
    calls = []

    def fake_get(url, *, timeout):
        calls.append((url, timeout))
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

    assert check_catalog.client_models() == check_catalog.predefined_models()
    assert calls == [("https://api.aipowergrid.io/v1/models", (5, 15))]
