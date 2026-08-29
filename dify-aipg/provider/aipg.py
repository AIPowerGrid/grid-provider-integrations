import logging

import requests
from dify_plugin import ModelProvider
from dify_plugin.errors.model import CredentialsValidateFailedError


logger = logging.getLogger(__name__)

API_BASE_URL = "https://api.aipowergrid.io/v1"
VALIDATION_TIMEOUT = (5, 15)


class AIPGProvider(ModelProvider):
    """Validate a Grid key without dispatching or reserving inference work."""

    def validate_provider_credentials(self, credentials: dict) -> None:
        api_key = str(credentials.get("api_key") or "").strip()
        if not api_key:
            raise CredentialsValidateFailedError("AI Power Grid API key is required")

        try:
            response = requests.get(
                f"{API_BASE_URL}/account/credits",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=VALIDATION_TIMEOUT,
                allow_redirects=False,
            )
        except requests.RequestException as exc:
            logger.warning(
                "AI Power Grid credential validation request failed: %s", type(exc).__name__
            )
            raise CredentialsValidateFailedError(
                "Could not reach AI Power Grid to validate this key"
            ) from exc

        if response.status_code == 200:
            return
        if response.status_code in {401, 403}:
            raise CredentialsValidateFailedError("Invalid API key or missing account.read scope")

        logger.warning(
            "AI Power Grid credential validation returned HTTP %s",
            response.status_code,
        )
        raise CredentialsValidateFailedError("AI Power Grid could not validate this key right now")
