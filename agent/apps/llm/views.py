import os

from django.http import FileResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .service.service import WebsiteAgentService


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def build_website(request):
    payload = request.data

    prompt = payload.get("prompt")
    if not prompt:
        return Response({"error": "'prompt' is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        service = WebsiteAgentService()
        result = service.create_and_run_website(
            prompt=prompt,
            project_name=payload.get("project_name"),
            port=payload.get("port"),
            project_type=payload.get("project_type", "classic_html"),
        )
        print("Build result:", result)
        print("Site URL:", result.get("site_url"))
        return Response(result, status=status.HTTP_201_CREATED)
    except Exception as exc:
        print("Build error:", str(exc))
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_website(request):
    payload = request.data

    site_url = payload.get("site_url")
    message = payload.get("message")
    if not site_url or not message:
        return Response(
            {"error": "'site_url' and 'message' are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        service = WebsiteAgentService()
        result = service.chat_with_website(
            site_url=site_url,
            message=message,
            apply_changes=bool(payload.get("apply_changes", False)),
            project_dir=payload.get("project_dir"),
            project_name=payload.get("project_name"),
            container_name=payload.get("container_name"),
            project_type=payload.get("project_type"),
        )
        return Response(result, status=status.HTTP_200_OK)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
