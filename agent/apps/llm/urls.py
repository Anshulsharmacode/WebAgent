from django.urls import path

from . import views

urlpatterns = [
    path("build/", views.build_website, name="llm-build-website"),
    path("chat/", views.chat_website, name="llm-chat-website"),
    path("stop/", views.stop_website, name="llm-stop-website"),
]
