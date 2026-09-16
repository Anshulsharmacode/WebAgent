from unittest.mock import patch
from django.test import TestCase
from apps.llm.service.llm import LLMService, ChatLiteLLM


class LLMServiceTests(TestCase):
    @patch("apps.llm.service.llm.litellm.completion")
    def test_llm_service_uses_litellm_completion(self, mock_completion):
        mock_completion.return_value.choices = [
            type("Choice", (), {"message": type("Message", (), {"content": "Hello"})()})()
        ]
        service = LLMService(api_key="test-api-key", model_name="gpt-4o")

        self.assertIsInstance(service.model, ChatLiteLLM)
        self.assertEqual(service.model.model_name, "gpt-4o")
        self.assertEqual(service.model.api_key, "test-api-key")

    @patch("apps.llm.service.llm.litellm.completion")
    def test_gemini_model_name_prefixing(self, mock_completion):
        service = LLMService(api_key="test-api-key", model_name="gemini-2.5-flash")
        self.assertEqual(service.model.model_name, "gemini/gemini-2.5-flash")

