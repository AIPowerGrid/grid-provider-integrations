from collections.abc import Generator

from dify_plugin import OAICompatLargeLanguageModel
from dify_plugin.entities.model.llm import LLMMode, LLMResult
from dify_plugin.entities.model.message import PromptMessage, PromptMessageTool


API_BASE_URL = "https://api.aipowergrid.io/v1"


class AIPGLargeLanguageModel(OAICompatLargeLanguageModel):
    @staticmethod
    def _prepared_credentials(credentials: dict) -> dict:
        prepared = dict(credentials)
        prepared["endpoint_url"] = API_BASE_URL
        prepared["mode"] = LLMMode.CHAT.value
        prepared["function_calling_type"] = "tool_call"
        prepared["stream_function_calling"] = "supported"
        return prepared

    def _invoke(
        self,
        model: str,
        credentials: dict,
        prompt_messages: list[PromptMessage],
        model_parameters: dict,
        tools: list[PromptMessageTool] | None = None,
        stop: list[str] | None = None,
        stream: bool = True,
        user: str | None = None,
    ) -> LLMResult | Generator:
        return super()._invoke(
            model,
            self._prepared_credentials(credentials),
            prompt_messages,
            model_parameters,
            tools,
            stop,
            stream,
            user,
        )

    def validate_credentials(self, model: str, credentials: dict) -> None:
        return super().validate_credentials(model, self._prepared_credentials(credentials))

    def get_num_tokens(
        self,
        model: str,
        credentials: dict,
        prompt_messages: list[PromptMessage],
        tools: list[PromptMessageTool] | None = None,
    ) -> int:
        return super().get_num_tokens(
            model,
            self._prepared_credentials(credentials),
            prompt_messages,
            tools,
        )
