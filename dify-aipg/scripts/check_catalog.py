"""Fail when Dify's predefined model IDs drift from the Grid client catalog."""

import os

from pathlib import Path

import requests
import yaml


ROOT = Path(__file__).resolve().parents[1]
CATALOG_URL = "https://api.aipowergrid.io/v1/models"


def predefined_models() -> set[str]:
    models = set()
    for path in (ROOT / "models" / "llm").glob("*.yaml"):
        if path.name == "_position.yaml":
            continue
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        models.add(data["model"])
    return models


def client_models() -> set[str]:
    api_key = os.environ.get("AIPG_API_KEY", "")
    if not api_key:
        raise SystemExit("Set AIPG_API_KEY to a scoped Grid key before checking the catalog")
    response = requests.get(
        CATALOG_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=(5, 15),
    )
    response.raise_for_status()
    payload = response.json()
    return {item["id"] for item in payload["data"]}


def main() -> None:
    predefined = predefined_models()
    client = client_models()
    if predefined != client:
        missing = sorted(client - predefined)
        stale = sorted(predefined - client)
        raise SystemExit(f"catalog drift: missing={missing}, stale={stale}")
    print(f"Dify catalog matches {len(client)} client-facing Grid text models")


if __name__ == "__main__":
    main()
