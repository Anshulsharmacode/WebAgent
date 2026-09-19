from django.urls import re_path
from .consumers import LLMStreamConsumer

websocket_urlpatterns = [
    re_path(r"^ws/llm/stream/$", LLMStreamConsumer.as_asgi()),
]
