import os

from django.http import FileResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .service.service import WebsiteAgentService


def get_llm_config_from_request(request):
    payload = request.data if isinstance(request.data, dict) else {}

    api_key = (
        payload.get("api_key")
        or payload.get("apiKey")
        or request.headers.get("X-API-Key")
        or request.headers.get("X-Api-Key")
        or request.headers.get("x-api-key")
        or request.GET.get("api_key")
        or request.GET.get("apiKey")
    )

    model_name = (
        payload.get("model_name")
        or payload.get("modelName")
        or payload.get("model")
        or request.headers.get("X-Model-Name")
        or request.headers.get("x-model-name")
        or request.GET.get("model_name")
        or request.GET.get("modelName")
        or request.GET.get("model")
    )

    user = getattr(request, "user", None)
    if user and getattr(user, "is_authenticated", False):
        if not api_key:
            api_key = getattr(user, "api_key", None)
        if not model_name:
            model_name = getattr(user, "model_name", None)

    return api_key, model_name



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_website(request):
    payload = request.data

    container = payload.get("container_id") or payload.get("container_name")
    if not container:
        return Response(
            {"error": "'container_id' or 'container_name' is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        service = WebsiteAgentService()
        result = service.stop_website(container_id_or_name=container)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_project(request):
    project_dir = request.GET.get("project_dir")
    if not project_dir:
        return Response({"error": "'project_dir' is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        service = WebsiteAgentService()
        zip_path = service.zip_project(project_dir)
        return FileResponse(open(zip_path, 'rb'), as_attachment=True, filename=os.path.basename(zip_path))
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
