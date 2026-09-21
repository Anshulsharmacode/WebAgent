from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .service.service import WebsiteAgentService


class LLMStreamConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def receive_json(self, content):
        action = content.get("action")
        api_key = content.get("api_key")
        model_name = content.get("model_name")

        service = WebsiteAgentService(api_key=api_key, model_name=model_name)

        try:
            if action == "build":
                prompt = content.get("prompt")
                if not prompt:
                    await self.send_json({"type": "error", "message": "'prompt' is required."})
                    return

                result = await service.stream_create_website(
                    prompt=prompt,
                    project_name=content.get("project_name"),
                    port=content.get("port"),
                    project_type=content.get("project_type", "classic_html"),
                    event_callback=self.send_json,
                )
                await self.send_json({"type": "complete", "action": "build", "result": result})

            elif action == "chat":
                site_url = content.get("site_url")
                message = content.get("message")
                if not site_url or not message:
                    await self.send_json({"type": "error", "message": "'site_url' and 'message' are required."})
                    return

                result = await service.stream_chat_website(
                    site_url=site_url,
                    message=message,
                    project_dir=content.get("project_dir"),
                    project_name=content.get("project_name"),
                    container_name=content.get("container_name"),
                    project_type=content.get("project_type"),
                    event_callback=self.send_json,
                )
                await self.send_json({"type": "complete", "action": "chat", "result": result})

            else:
                await self.send_json({"type": "error", "message": f"Unknown action: {action}"})

        except Exception as exc:
            await self.send_json({"type": "error", "message": str(exc)})
