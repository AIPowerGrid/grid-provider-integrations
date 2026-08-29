from decimal import Decimal
import os
from pathlib import Path
import subprocess

import yaml


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models" / "llm"
EXPECTED_MODELS = {
    "auto",
    "deepseek-v4-flash-nvfp4",
    "gpt-oss-120b",
}


def model_documents():
    for path in MODEL_DIR.glob("*.yaml"):
        if path.name != "_position.yaml":
            yield path, yaml.safe_load(path.read_text(encoding="utf-8"))


def test_manifest_and_provider_use_fixed_aipg_identity():
    manifest = yaml.safe_load((ROOT / "manifest.yaml").read_text(encoding="utf-8"))
    provider = yaml.safe_load((ROOT / "provider" / "aipg.yaml").read_text(encoding="utf-8"))

    assert manifest["name"] == "aipg"
    assert manifest["plugins"]["models"] == ["provider/aipg.yaml"]
    assert provider["provider"] == "aipg"
    assert provider["supported_model_types"] == ["llm"]
    credentials = provider["provider_credential_schema"]["credential_form_schemas"]
    assert credentials == [
        {
            "label": {"en_US": "API Key"},
            "placeholder": {"en_US": "Enter a key with account.read and inference.submit scopes"},
            "required": True,
            "type": "secret-input",
            "variable": "api_key",
        }
    ]


def test_predefined_models_match_expected_catalog_and_position_order():
    models = {document["model"] for _, document in model_documents()}
    position = yaml.safe_load((MODEL_DIR / "_position.yaml").read_text(encoding="utf-8"))

    assert models == EXPECTED_MODELS
    assert set(position) == EXPECTED_MODELS
    assert len(position) == len(set(position))


def test_only_reviewed_named_models_have_nonzero_static_prices():
    prices = {
        document["model"]: (
            Decimal(document["pricing"]["input"]),
            Decimal(document["pricing"]["output"]),
        )
        for _, document in model_documents()
    }

    assert prices["auto"] == (Decimal(0), Decimal(0))
    assert prices["gpt-oss-120b"] == (Decimal("0.075"), Decimal("0.30"))
    assert prices["deepseek-v4-flash-nvfp4"] == (Decimal("0.07"), Decimal("0.14"))


def test_packager_requirements_match_frozen_runtime_lock():
    env = os.environ.copy()
    env.setdefault("UV_CACHE_DIR", "/tmp/aipg-dify-uv")
    exported = subprocess.run(
        [
            "uv",
            "export",
            "--frozen",
            "--offline",
            "--format",
            "requirements-txt",
            "--no-group",
            "dev",
            "--no-emit-project",
            "--no-hashes",
            "--no-header",
        ],
        cwd=ROOT,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    ).stdout

    def requirement_entries(contents: str) -> list[str]:
        return [
            line.strip()
            for line in contents.splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        ]

    packaged = (ROOT / "requirements.txt").read_text(encoding="utf-8")
    assert requirement_entries(packaged) == requirement_entries(exported)
    assert "pytest==" not in packaged
    assert "ruff==" not in packaged
