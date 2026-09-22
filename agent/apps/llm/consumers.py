import time
from datetime import datetime
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .service.service import WebsiteAgentService


class LLMStreamConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{now_str}] [WS CONNECT] Client connected to LLMStreamConsumer", flush=True)

    async def disconnect(self, close_code):
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{now_str}] [WS DISCONNECT] Client disconnected (code: {close_code})", flush=True)

    async def receive_json(self, content):
        action = content.get("action")
        api_key = content.get("api_key")
        model_name = content.get("model_name")

        service = WebsiteAgentService(api_key=api_key, model_name=model_name)

        start_time = time.time()
        last_step_time = start_time
        seen_files = set()
        chat_stream_started = False

        def log_step(step_type, detail=""):
            nonlocal last_step_time
            now = time.time()
            step_duration = now - last_step_time
            total_duration = now - start_time
            last_step_time = now
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            detail_str = f" - {detail}" if detail else ""
            print(
                f"[{timestamp}] [{step_type}]{detail_str} "
                f"(Step: {step_duration:.2f}s | Total: {total_duration:.2f}s)",
                flush=True,
            )

        async def timed_event_callback(event):
            nonlocal chat_stream_started
            event_type = event.get("type")
            if event_type == "status":
                log_step("STEP: STATUS", event.get("message", ""))
            elif event_type == "file_chunk":
                filename = event.get("filename")
                if filename and filename not in seen_files:
                    seen_files.add(filename)
                    log_step("STEP: FILE", f"Generating '{filename}'")
            elif event_type == "chunk":
                if not chat_stream_started:
                    chat_stream_started = True
                    target = event.get("target", "chat")
                    log_step("STEP: CHAT STREAM", f"Started streaming response ({target})")
            else:
                log_step(f"STEP: {event_type.upper() if event_type else 'EVENT'}", str(event))

            await self.send_json(event)

        try:
            if action == "build":
                prompt = content.get("prompt")

                if not prompt:
                    await self.send_json({"type": "error", "message": "'prompt' is required."})
                    return

                prompt_disp = prompt if len(prompt) <= 60 else f"{prompt[:57]}..."
                log_step(
                    "BUILD START",
                    f"Prompt: '{prompt_disp}' | Project: '{content.get('project_name')}' | Type: '{content.get('project_type', 'classic_html')}'",
                )

                result = await service.stream_create_website(
                    prompt=prompt,
                    project_name=content.get("project_name"),
                    port=content.get("port"),
                    project_type=content.get("project_type", "classic_html"),
                    event_callback=timed_event_callback,
                )
                log_step("BUILD COMPLETE", f"Website created successfully")
                await self.send_json({"type": "complete", "action": "build", "result": result})

            elif action == "chat":
                site_url = content.get("site_url")
                message = content.get("message")
                if not site_url or not message:
                    await self.send_json({"type": "error", "message": "'site_url' and 'message' are required."})
                    return

                msg_disp = message if len(message) <= 60 else f"{message[:57]}..."
                log_step("CHAT START", f"Message: '{msg_disp}' | Site URL: '{site_url}'")

                result = await service.stream_chat_website(
                    site_url=site_url,
                    message=message,
                    project_dir=content.get("project_dir"),
                    project_name=content.get("project_name"),
                    container_name=content.get("container_name"),
                    project_type=content.get("project_type"),
                    event_callback=timed_event_callback,
                )
                log_step("CHAT COMPLETE", f"Chat processed successfully")
                await self.send_json({"type": "complete", "action": "chat", "result": result})

            else:
                log_step("UNKNOWN ACTION", f"Action: '{action}'")
                await self.send_json({"type": "error", "message": f"Unknown action: {action}"})

        except Exception as exc:
            log_step("ERROR", f"{exc}")
            await self.send_json({"type": "error", "message": str(exc)})

