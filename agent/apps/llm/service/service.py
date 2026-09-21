import re
import shutil
import tempfile
from pathlib import Path
from django.conf import settings
from asgiref.sync import async_to_sync, sync_to_async

from .chat import ChatService
from .docker import DockerService
from .llm import LLMService

# ── File-chunk streaming helper ──────────────────────────────────────────────

# Known JSON "meta" keys emitted by the LLM that are NOT filenames.
_META_KEYS = {"summary", "name", "purpose"}

# Precompiled pattern: matches  "key": "value_so_far  (value may be unclosed)
_FILE_CHUNK_RE = re.compile(
    r'"((?:[^"\\]|\\.)+?)"\s*:\s*"((?:[^"\\]|\\.)*)',
    re.DOTALL,
)


def _extract_file_chunks(buffer: str) -> list[tuple[str, str]]:
    """
    Incrementally scan a partial JSON buffer and return (filename, content_so_far)
    for every file key found so far. Non-file meta keys are skipped.
    """
    results: list[tuple[str, str]] = []
    for match in _FILE_CHUNK_RE.finditer(buffer):
        filename = match.group(1)
        if filename in _META_KEYS or ("/" not in filename and "." not in filename):
            # skip pure-JSON meta keys like "summary"
            if filename in _META_KEYS:
                continue
        raw_value = match.group(2)
        # Handle trailing backslashes in partial JSON escape sequences cleanly
        num_bs = len(raw_value) - len(raw_value.rstrip("\\"))
        clean_val = raw_value[:-1] if num_bs % 2 == 1 else raw_value
        try:
            content = clean_val.encode("raw_unicode_escape").decode("unicode_escape")
        except Exception:
            content = clean_val
        results.append((filename, content))
    return results


# ── Central orchestrator ─────────────────────────────────────────────────────

class WebsiteAgentService:
    """Central orchestrator for prompt -> code -> docker -> chat streaming pipeline."""

    def __init__(
        self,
        api_key: str | None = None,
        model_name: str | None = None,
        user=None,
    ) -> None:
        resolved_api_key = api_key
        resolved_model_name = model_name

        if user and getattr(user, "is_authenticated", True):
            resolved_api_key = resolved_api_key or getattr(user, "api_key", None)
            resolved_model_name = resolved_model_name or getattr(user, "model_name", None)

        self.llm = LLMService(api_key=resolved_api_key, model_name=resolved_model_name)
        self.chat = ChatService()
        self.docker = DockerService(Path(settings.BASE_DIR) / "generated_sites")

    # ── Build ────────────────────────────────────────────────────────────────

    def create_and_run_website(
        self,
        prompt: str,
        project_name: str | None = None,
        port: int | None = None,
        project_type: str = "classic_html",
    ) -> dict:
        """Synchronously creates and runs a website."""
        return async_to_sync(self.stream_create_website)(
            prompt=prompt,
            project_name=project_name,
            port=port,
            project_type=project_type,
        )

    async def stream_create_website(
        self,
        prompt: str,
        project_name: str | None = None,
        port: int | None = None,
        project_type: str = "classic_html",
        event_callback=None,
    ) -> dict:
        """Asynchronously orchestrates and streams website generation."""
        normalized_type = self.llm.normalize_project_type(project_type)

        if event_callback:
            await event_callback({"type": "status", "message": "Generating website files..."})

        clean_name = re.sub(r"[^a-z0-9]+", "-", prompt.lower()[:30]).strip("-") or "generated-site"
        name = project_name or clean_name

        generated_files = None
        raw_buffer = ""
        prev_file_lengths: dict[str, int] = {}

        async for chunk, final_json in self.llm.stream_generate_website_files(prompt, normalized_type):
            if chunk and event_callback:
                raw_buffer += chunk
                file_chunks = _extract_file_chunks(raw_buffer)
                for filename, content in file_chunks:
                    prev_len = prev_file_lengths.get(filename, 0)
                    if len(content) > prev_len:
                        new_chars = content[prev_len:]
                        prev_file_lengths[filename] = len(content)
                        await event_callback({
                            "type": "file_chunk",
                            "filename": filename,
                            "content": new_chars,
                        })
            if final_json:
                generated_files = final_json

        if event_callback:
            await event_callback({"type": "status", "message": "Preparing and running Docker container..."})

        project_dir = await sync_to_async(self.docker.prepare_project)(name, generated_files, project_type=normalized_type)
        container = await sync_to_async(self.docker.build_and_run)(project_dir, name, host_port=port)

        return {
            "name": name,
            "project_type": normalized_type,
            "project_dir": str(project_dir),
            "files": list(generated_files.keys()),
            "generated_files": generated_files,
            **container,
        }

    # ── Chat ─────────────────────────────────────────────────────────────────

    def chat_with_website(
        self,
        site_url: str,
        message: str,
        apply_changes: bool = False,
        project_dir: str | None = None,
        project_name: str | None = None,
        container_name: str | None = None,
        project_type: str | None = None,
    ) -> dict:
        """Synchronously chats with or edits a website."""
        return async_to_sync(self.stream_chat_website)(
            site_url=site_url,
            message=message,
            apply_changes=apply_changes,
            project_dir=project_dir,
            project_name=project_name,
            container_name=container_name,
            project_type=project_type,
        )

    async def stream_chat_website(
        self,
        site_url: str,
        message: str,
        apply_changes: bool = False,
        project_dir: str | None = None,
        project_name: str | None = None,
        container_name: str | None = None,
        project_type: str | None = None,
        event_callback=None,
    ) -> dict:
        """Asynchronously streams site consultation or applies edits."""
        if event_callback:
            await event_callback({"type": "status", "message": "Analyzing request..."})

        # --- Intent detection (pure string matching, instant) ---
        should_apply = False
        if project_dir and Path(project_dir).exists():
            if apply_changes:
                should_apply = True
            else:
                should_apply = await sync_to_async(self.llm.should_apply_changes)(message)

        # ── Conversational Q&A path ──────────────────────────────────────────
        if not should_apply:
            if event_callback:
                await event_callback({"type": "status", "message": "Thinking..."})

            # Fetch snapshot async with short timeout — don't block the LLM start
            snapshot = await self.chat.fetch_site_snapshot(site_url)

            full_answer = ""
            async for chunk in self.llm.stream_chat_about_site(snapshot, message):
                if chunk:
                    full_answer += chunk
                    if event_callback:
                        await event_callback({"type": "chunk", "target": "chat", "content": chunk})

            return {"answer": full_answer, "changes_applied": False}

        # ── Apply-changes path ───────────────────────────────────────────────
        if event_callback:
            await event_callback({"type": "status", "message": "Drafting code updates..."})

        existing_files = await sync_to_async(self.docker.read_project_files)(Path(project_dir))
        meta = await sync_to_async(self.docker.get_project_meta)(Path(project_dir))
        normalized_type = self.llm.normalize_project_type(project_type or meta.get("project_type"))

        updated_files = None
        raw_buffer = ""
        prev_file_lengths: dict[str, int] = {}

        async for chunk, final_json in self.llm.stream_apply_website_changes(existing_files, message, normalized_type):
            if chunk and event_callback:
                raw_buffer += chunk
                file_chunks = _extract_file_chunks(raw_buffer)
                for filename, content in file_chunks:
                    prev_len = prev_file_lengths.get(filename, 0)
                    if len(content) > prev_len:
                        new_chars = content[prev_len:]
                        prev_file_lengths[filename] = len(content)
                        await event_callback({
                            "type": "file_chunk",
                            "filename": filename,
                            "content": new_chars,
                        })
            if final_json:
                updated_files = final_json

        if event_callback:
            await event_callback({"type": "status", "message": "Applying changes and rebuilding container..."})

        await sync_to_async(self.docker.write_project_files)(Path(project_dir), updated_files, project_type=normalized_type)

        selected_port = int(site_url.rsplit(":", 1)[-1])
        container = await sync_to_async(self.docker.rebuild_and_run)(
            project_dir=Path(project_dir),
            project_name=project_name or Path(project_dir).name,
            host_port=selected_port,
            previous_container=container_name,
        )

        summary_msg = updated_files.get("summary", "I have updated your project code according to your request!")
        if event_callback:
            await event_callback({"type": "chunk", "target": "chat", "content": summary_msg})

        return {
            "answer": summary_msg,
            "changes_applied": True,
            "project_type": normalized_type,
            "change_summary": summary_msg,
            "generated_files": {k: v for k, v in updated_files.items() if k != "summary"},
            **container,
        }

    # ── Utilities ─────────────────────────────────────────────────────────────

    def stop_website(self, container_id_or_name: str) -> dict:
        self.docker.stop_and_remove(container_id_or_name)
        return {"status": "stopped"}

    def zip_project(self, project_dir: str) -> str:
        path = Path(project_dir)
        if not path.exists():
            raise FileNotFoundError(f"Project directory {project_dir} not found.")

        temp_dir = Path(tempfile.gettempdir())
        zip_base = temp_dir / f"project-{path.name}"
        return shutil.make_archive(str(zip_base), "zip", path)
