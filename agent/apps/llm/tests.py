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


from apps.llm.service.service import WebsiteAgentService


class WebsiteAgentServiceTests(TestCase):
    @patch.object(WebsiteAgentService, "stream_create_website")
    def test_create_and_run_website_sync_wrapper(self, mock_stream):
        async def fake_stream(*args, **kwargs):
            return {"site_url": "http://localhost:5000"}

        mock_stream.side_effect = fake_stream
        service = WebsiteAgentService()
        res = service.create_and_run_website(prompt="test prompt")
        self.assertEqual(res, {"site_url": "http://localhost:5000"})

    @patch.object(WebsiteAgentService, "stream_chat_website")
    def test_chat_with_website_sync_wrapper(self, mock_stream):
        async def fake_stream(*args, **kwargs):
            return {"answer": "hello"}

        mock_stream.side_effect = fake_stream
        service = WebsiteAgentService()
        res = service.chat_with_website(site_url="http://localhost:5000", message="hi")
        self.assertEqual(res, {"answer": "hello"})


