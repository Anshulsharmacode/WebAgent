import json
from pathlib import Path
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from asgiref.sync import sync_to_async
from django.conf import settings
from .service.llm import LLMService
from .service.chat import ChatService
from .service.docker import DockerService


class LLMStreamConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def receive_json(self, content):
        action = content.get("action")
        api_key = content.get("api_key")
        model_name = content.get("model_name")

        self.llm = LLMService(api_key=api_key, model_name=model_name)
        self.docker = DockerService(Path(settings.BASE_DIR) / "generated_sites")
        self.chat_service = ChatService()

        try:
            if action == "build":
                await self.handle_build(content)
            elif action == "chat":
                await self.handle_chat(content)
            else:
                await self.send_json({"type": "error", "message": f"Unknown action: {action}"})
        except Exception as exc:
            await self.send_json({"type": "error", "message": str(exc)})

    async def handle_build(self, payload):
        prompt = payload.get("prompt")
        if not prompt:
            await self.send_json({"type": "error", "message": "'prompt' is required."})
            return

        project_name = payload.get("project_name")
        project_type = self.llm.normalize_project_type(payload.get("project_type", "classic_html"))

        await self.send_json({"type": "status", "message": "Planning website structure..."})
        plan = await sync_to_async(self.llm.create_website_plan)(prompt, project_type)

        await self.send_json({"type": "status", "message": "Generating website files..."})
        generated_files = None

        async for chunk, final_json in self.llm.stream_generate_website_files(prompt, plan, project_type):
            if chunk:
                await self.send_json({"type": "chunk", "target": "code", "content": chunk})
            if final_json:
                generated_files = final_json

        await self.send_json({"type": "status", "message": "Preparing and running Docker container..."})
        name = project_name or plan.get("name") or "generated-site"

        project_dir = await sync_to_async(self.docker.prepare_project)(name, generated_files, project_type=project_type)
        container = await sync_to_async(self.docker.build_and_run)(project_dir, name, host_port=payload.get("port"))

        await self.send_json({
            "type": "complete",
            "action": "build",
            "result": {
                "plan": plan,
                "project_type": project_type,
                "project_dir": str(project_dir),
                "files": list(generated_files.keys()),
                "generated_files": generated_files,
                **container,
            }
        })

    async def handle_chat(self, payload):
        site_url = payload.get("site_url")
        message = payload.get("message")
        apply_changes = payload.get("apply_changes", False)
        project_dir = payload.get("project_dir")

        if not site_url or not message:
            await self.send_json({"type": "error", "message": "'site_url' and 'message' are required."})
            return

        await self.send_json({"type": "status", "message": "Analyzing site snapshot..."})
        snapshot = await sync_to_async(self.chat_service.fetch_site_snapshot)(site_url)

        if not apply_changes or not project_dir:
            await self.send_json({"type": "status", "message": "Thinking..."})
            answer = await sync_to_async(self.llm.chat_about_site)(snapshot, message)
            await self.send_json({"type": "chunk", "target": "chat", "content": answer})
            await self.send_json({
                "type": "complete",
                "action": "chat",
                "result": {"answer": answer}
            })
            return

        await self.send_json({"type": "status", "message": "Drafting code updates..."})
        existing_files = await sync_to_async(self.docker.read_project_files)(Path(project_dir))
        meta = await sync_to_async(self.docker.get_project_meta)(Path(project_dir))
        normalized_type = self.llm.normalize_project_type(payload.get("project_type") or meta.get("project_type"))

        updated_files = None
        async for chunk, final_json in self.llm.stream_apply_website_changes(existing_files, message, normalized_type):
            if chunk:
                await self.send_json({"type": "chunk", "target": "code", "content": chunk})
            if final_json:
                updated_files = final_json

        await self.send_json({"type": "status", "message": "Applying changes and rebuilding container..."})
        await sync_to_async(self.docker.write_project_files)(Path(project_dir), updated_files, project_type=normalized_type)

        selected_port = int(site_url.rsplit(":", 1)[-1])
        container = await sync_to_async(self.docker.rebuild_and_run)(
            project_dir=Path(project_dir),
            project_name=payload.get("project_name") or Path(project_dir).name,
            host_port=selected_port,
            previous_container=payload.get("container_name"),
        )

        await self.send_json({
            "type": "complete",
            "action": "chat",
            "result": {
                "answer": updated_files.get("summary", "Changes applied successfully."),
                "changes_applied": True,
                "project_type": normalized_type,
                "change_summary": updated_files.get("summary", ""),
                "generated_files": {k: v for k, v in updated_files.items() if k != "summary"},
                **container,
            }
        })
