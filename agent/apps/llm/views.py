import json
import os

from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET

from .service.service import WebsiteAgentService


def _parse_json(request):
    try:
        return json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


@csrf_exempt
@require_POST
def build_website(request):
    payload = _parse_json(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    prompt = payload.get("prompt")
    if not prompt:
        return JsonResponse({"error": "'prompt' is required."}, status=400)

    try:
        service = WebsiteAgentService()
        result = service.create_and_run_website(
            prompt=prompt,
            project_name=payload.get("project_name"),
            port=payload.get("port"),
            project_type=payload.get("project_type", "classic_html"),
        )
        return JsonResponse(result, status=201)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@csrf_exempt
@require_POST
def chat_website(request):
    payload = _parse_json(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    site_url = payload.get("site_url")
    message = payload.get("message")
    if not site_url or not message:
        return JsonResponse({"error": "'site_url' and 'message' are required."}, status=400)

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
        return JsonResponse(result, status=200)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@csrf_exempt
@require_POST
def stop_website(request):
    payload = _parse_json(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    container = payload.get("container_id") or payload.get("container_name")
    if not container:
        return JsonResponse({"error": "'container_id' or 'container_name' is required."}, status=400)

    try:
        service = WebsiteAgentService()
        result = service.stop_website(container_id_or_name=container)
        return JsonResponse(result, status=200)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@require_GET
def download_project(request):
    project_dir = request.GET.get("project_dir")
    if not project_dir:
        return JsonResponse({"error": "'project_dir' is required."}, status=400)

    try:
        service = WebsiteAgentService()
        zip_path = service.zip_project(project_dir)
        
        # Open the file and return it as a response
        # FileResponse will automatically close the file
        response = FileResponse(open(zip_path, 'rb'), as_attachment=True, filename=os.path.basename(zip_path))
        return response
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)
