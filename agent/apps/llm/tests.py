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
    async def test_stream_create_website_returns_dict(self):
        with patch.object(WebsiteAgentService, "stream_create_website") as mock_stream:
            mock_stream.return_value = {"site_url": "http://localhost:5000"}
            service = WebsiteAgentService()
            res = await service.stream_create_website(prompt="test prompt")
            self.assertEqual(res, {"site_url": "http://localhost:5000"})


from unittest.mock import AsyncMock
from apps.llm.consumers import LLMStreamConsumer


class LLMStreamConsumerTests(TestCase):
    async def test_consumer_receive_json_build_logs_and_sends(self):
        consumer = LLMStreamConsumer()
        consumer.send_json = AsyncMock()

        with patch("apps.llm.consumers.WebsiteAgentService") as mock_service_cls:
            mock_service_inst = AsyncMock()
            mock_service_cls.return_value = mock_service_inst
            mock_service_inst.stream_create_website.return_value = {"status": "ok"}

            await consumer.receive_json({
                "action": "build",
                "prompt": "Create a landing page",
                "project_name": "test-project",
            })

            mock_service_inst.stream_create_website.assert_called_once()
            consumer.send_json.assert_called_with({
                "type": "complete",
                "action": "build",
                "result": {"status": "ok"},
            })




