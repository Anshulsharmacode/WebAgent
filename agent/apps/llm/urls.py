from django.urls import path

from . import views

urlpatterns = [
    path("stop/", views.stop_website, name="llm-stop-website"),
    path("download/", views.download_project, name="llm-download-project"),
]

