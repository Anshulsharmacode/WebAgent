import random
import shutil
import subprocess
from pathlib import Path


class DockerService:
    """Creates and runs generated static websites inside Docker."""

    def __init__(self, base_dir: Path) -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _safe_name(self, value: str) -> str:
        allowed = "abcdefghijklmnopqrstuvwxyz0123456789-"
        candidate = "".join(ch.lower() if ch.lower() in allowed else "-" for ch in value)
        return "-".join(filter(None, candidate.split("-"))) or "generated-site"

    def prepare_project(self, project_name: str, files: dict) -> Path:
        safe_name = self._safe_name(project_name)
        project_dir = self.base_dir / safe_name

        if project_dir.exists():
            shutil.rmtree(project_dir)
        project_dir.mkdir(parents=True)

        (project_dir / "index.html").write_text(files["index.html"], encoding="utf-8")
        (project_dir / "styles.css").write_text(files["styles.css"], encoding="utf-8")
        (project_dir / "script.js").write_text(files["script.js"], encoding="utf-8")
        (project_dir / "Dockerfile").write_text(
            "FROM nginx:alpine\nCOPY . /usr/share/nginx/html\n",
            encoding="utf-8",
        )

        return project_dir

    def read_project_files(self, project_dir: Path) -> dict:
        project_dir = Path(project_dir)
        return {
            "index.html": (project_dir / "index.html").read_text(encoding="utf-8"),
            "styles.css": (project_dir / "styles.css").read_text(encoding="utf-8"),
            "script.js": (project_dir / "script.js").read_text(encoding="utf-8"),
        }

    def write_project_files(self, project_dir: Path, files: dict) -> None:
        project_dir = Path(project_dir)
        (project_dir / "index.html").write_text(files["index.html"], encoding="utf-8")
        (project_dir / "styles.css").write_text(files["styles.css"], encoding="utf-8")
        (project_dir / "script.js").write_text(files["script.js"], encoding="utf-8")

    def _build_image(self, project_dir: Path, image_tag: str) -> None:
        build = subprocess.run(
            ["docker", "build", "-t", image_tag, "."],
            cwd=project_dir,
            capture_output=True,
            text=True,
            check=False,
        )
        if build.returncode != 0:
            raise RuntimeError(f"Docker build failed: {build.stderr.strip()}")

    def _run_container(self, image_tag: str, container_name: str, selected_port: int) -> dict:
        run = subprocess.run(
            [
                "docker",
                "run",
                "-d",
                "--name",
                container_name,
                "-p",
                f"{selected_port}:80",
                image_tag,
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        if run.returncode != 0:
            raise RuntimeError(f"Docker run failed: {run.stderr.strip()}")

        return {
            "container_id": run.stdout.strip(),
            "container_name": container_name,
            "image_tag": image_tag,
            "host_port": selected_port,
            "site_url": f"http://localhost:{selected_port}",
        }

    def build_and_run(self, project_dir: Path, project_name: str, host_port: int | None = None) -> dict:
        safe_name = self._safe_name(project_name)
        image_tag = f"llm-site-{safe_name}"
        container_name = f"llm-site-{safe_name}-{random.randint(1000, 9999)}"
        selected_port = host_port or random.randint(12000, 22000)

        self._build_image(project_dir, image_tag)
        return self._run_container(image_tag, container_name, selected_port)

    def rebuild_and_run(
        self,
        project_dir: Path,
        project_name: str,
        host_port: int,
        previous_container: str | None = None,
    ) -> dict:
        safe_name = self._safe_name(project_name)
        image_tag = f"llm-site-{safe_name}"
        new_container_name = f"llm-site-{safe_name}-{random.randint(1000, 9999)}"

        self._build_image(project_dir, image_tag)
        if previous_container:
            self.stop_and_remove(previous_container)

        return self._run_container(image_tag, new_container_name, host_port)

    def stop_and_remove(self, container_id_or_name: str) -> None:
        subprocess.run(
            ["docker", "rm", "-f", container_id_or_name],
            capture_output=True,
            text=True,
            check=False,
        )
