import shutil
import tempfile
from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings

from .chat import ChatService
from .docker import DockerService
from .llm import LLMService


class WebsiteAgentService:
    """Orchestrates prompt -> code -> docker -> chat."""

    def __init__(self) -> None:
        self.llm = LLMService()
        self.chat = ChatService()
        self.docker = DockerService(Path(settings.BASE_DIR) / "generated_sites")

    def create_and_run_website(
        self,
        prompt: str,
        project_name: str | None = None,
        port: int | None = None,
        project_type: str = "classic_html",
    ) -> dict:
        normalized_type = self.llm.normalize_project_type(project_type)
        plan = self.llm.create_website_plan(prompt, normalized_type)
        files = self.llm.generate_website_files(prompt, plan, normalized_type)

        name = project_name or plan.get("name") or "generated-site"
        project_dir = self.docker.prepare_project(name, files, project_type=normalized_type)
        container = self.docker.build_and_run(project_dir, name, host_port=port)

        return {
            "plan": plan,
            "project_type": normalized_type,
            "project_dir": str(project_dir),
            "files": list(files.keys()),
            "generated_files": files,
            **container,
        }

    @staticmethod
    def _port_from_site_url(site_url: str) -> int:
        parsed = urlparse(site_url)
        if not parsed.port:
            raise ValueError("site_url must include an explicit port, for example http://localhost:13000")
        return parsed.port

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
        snapshot = self.chat.fetch_site_snapshot(site_url)
        answer = self.llm.chat_about_site(snapshot, message)
        result = {"answer": answer}

        should_apply = apply_changes or bool(project_dir)
        if not should_apply:
            return result

        if not project_dir:
            raise ValueError("project_dir is required when apply_changes=true.")

        meta = self.docker.get_project_meta(Path(project_dir))
        normalized_type = self.llm.normalize_project_type(project_type or meta.get("project_type"))
        existing_files = self.docker.read_project_files(Path(project_dir))
        updated_files = self.llm.apply_website_changes(existing_files, message, normalized_type)
        self.docker.write_project_files(Path(project_dir), updated_files, project_type=normalized_type)

        selected_port = self._port_from_site_url(site_url)
        project_label = project_name or Path(project_dir).name
        container = self.docker.rebuild_and_run(
            project_dir=Path(project_dir),
            project_name=project_label,
            host_port=selected_port,
            previous_container=container_name,
        )

        result.update(
            {
                "changes_applied": True,
                "project_type": normalized_type,
                "change_summary": updated_files.get("summary", ""),
                "generated_files": {k: v for k, v in updated_files.items() if k != "summary"},
                **container,
            }
        )
        return result

    def stop_website(self, container_id_or_name: str) -> dict:
        self.docker.stop_and_remove(container_id_or_name)
        return {"status": "stopped"}

    def zip_project(self, project_dir: str) -> str:
        """Create a zip archive of the project directory."""
        path = Path(project_dir)
        if not path.exists():
            raise FileNotFoundError(f"Project directory {project_dir} not found.")

        # Create a temporary file for the zip archive
        temp_dir = Path(tempfile.gettempdir())
        zip_base = temp_dir / f"project-{path.name}"
        zip_path = shutil.make_archive(str(zip_base), "zip", path)
        return zip_path
