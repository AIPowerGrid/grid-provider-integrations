"""Fail when Dify's predefined text metadata drifts from the public Grid."""

from pathlib import Path

import requests
import yaml


ROOT = Path(__file__).resolve().parents[1]
CATALOG_URL = "https://api.aipowergrid.io/v1/models"
STATUS_URL = "https://api.aipowergrid.io/v1/status/models"
ROUTER_MODELS = frozenset({"auto"})


def predefined_models() -> dict[str, int]:
    models = {}
    for path in (ROOT / "models" / "llm").glob("*.yaml"):
        if path.name == "_position.yaml":
            continue
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        models[data["model"]] = data["model_properties"]["context_size"]
    return models


def client_models() -> set[str]:
    response = requests.get(
        CATALOG_URL,
        timeout=(5, 15),
    )
    response.raise_for_status()
    payload = response.json()
    return {item["id"] for item in payload["data"]}


def online_text_contexts() -> dict[str, int]:
    response = requests.get(
        STATUS_URL,
        timeout=(5, 15),
    )
    response.raise_for_status()
    return {
        item["name"]: item["max_context_length"]
        for item in response.json()
        if item.get("type") == "text"
    }


def validate_catalog(
    predefined: dict[str, int],
    client: set[str],
    online: dict[str, int],
) -> set[str]:
    predefined_ids = set(predefined)
    stale = sorted(predefined_ids - client)
    if stale:
        raise SystemExit(f"catalog drift: stale={stale}")

    concrete_models = predefined_ids - ROUTER_MODELS
    missing_status = sorted(concrete_models - set(online))
    context_drift = {
        model: {"dify": predefined[model], "grid": online[model]}
        for model in sorted(concrete_models & set(online))
        if predefined[model] != online[model]
    }
    if missing_status or context_drift:
        raise SystemExit(
            f"metadata drift: missing_status={missing_status}, context={context_drift}"
        )

    return client - predefined_ids


def main() -> None:
    predefined = predefined_models()
    client = client_models()
    online = online_text_contexts()
    dynamic_candidates = sorted(validate_catalog(predefined, client, online))
    print(
        f"Dify metadata matches {len(predefined)} curated Grid text models "
        f"and {len(set(predefined) - ROUTER_MODELS)} concrete context windows; "
        f"live models awaiting static price/metadata review={dynamic_candidates}"
    )


if __name__ == "__main__":
    main()
