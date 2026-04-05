import json
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

    @staticmethod
    def _normalize_project_type(project_type: str | None) -> str:
        value = (project_type or "classic_html").strip().lower().replace("-", "_")
        if value not in {"classic_html", "react"}:
            raise ValueError("project_type must be one of: classic_html, react")
        return value

    @staticmethod
    def _resolve_path(project_dir: Path, relative_path: str) -> Path:
        target = (project_dir / relative_path).resolve()
        if project_dir.resolve() not in target.parents and target != project_dir.resolve():
            raise ValueError(f"Invalid file path: {relative_path}")
        return target

    def _write_manifest(self, project_dir: Path, project_type: str, files: dict) -> None:
        manifest = {
            "project_type": project_type,
            "managed_files": sorted(files.keys()),
        }
        (project_dir / ".project_manifest.json").write_text(
            json.dumps(manifest, indent=2),
            encoding="utf-8",
        )

    def _load_manifest(self, project_dir: Path) -> dict | None:
        manifest_path = project_dir / ".project_manifest.json"
        if not manifest_path.exists():
            return None
        try:
            return json.loads(manifest_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return None

    def _dockerfile_for(self, project_type: str) -> str:
        if project_type == "react":
            return (
                "FROM node:20-alpine AS build\n"
                "WORKDIR /app\n"
                "COPY package*.json ./\n"
                "RUN npm install --no-audit --no-fund\n"
                "COPY . .\n"
                "RUN npm run build\n\n"
                "FROM nginx:alpine\n"
                "COPY --from=build /app/dist /usr/share/nginx/html\n"
                "COPY nginx.conf /etc/nginx/conf.d/default.conf\n"
            )
        return "FROM nginx:alpine\nCOPY . /usr/share/nginx/html\n"

    def _ensure_runtime_files(self, project_dir: Path, project_type: str) -> None:
        (project_dir / "Dockerfile").write_text(self._dockerfile_for(project_type), encoding="utf-8")
        if project_type == "react":
            (project_dir / "nginx.conf").write_text(
                (
                    "server {\n"
                    "  listen 80;\n"
                    "  server_name _;\n"
                    "  root /usr/share/nginx/html;\n"
                    "  index index.html;\n"
                    "  location / {\n"
                    "    try_files $uri $uri/ /index.html;\n"
                    "  }\n"
                    "}\n"
                ),
                encoding="utf-8",
            )

    def prepare_project(self, project_name: str, files: dict, project_type: str = "classic_html") -> Path:
        normalized_type = self._normalize_project_type(project_type)
        safe_name = self._safe_name(project_name)
        project_dir = self.base_dir / safe_name

        if project_dir.exists():
            shutil.rmtree(project_dir)
        project_dir.mkdir(parents=True)

        for relative_path, content in files.items():
            target = self._resolve_path(project_dir, relative_path)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")

        self._ensure_runtime_files(project_dir, normalized_type)
        self._write_manifest(project_dir, normalized_type, files)

        return project_dir

    def get_project_meta(self, project_dir: Path) -> dict:
        project_dir = Path(project_dir)
        manifest = self._load_manifest(project_dir)

        if manifest and manifest.get("managed_files"):
            managed_files = [path for path in manifest["managed_files"] if isinstance(path, str)]
            project_type = self._normalize_project_type(manifest.get("project_type"))
            return {
                "project_type": project_type,
                "managed_files": managed_files,
            }

        if (project_dir / "package.json").exists():
            return {
                "project_type": "react",
                "managed_files": [
                    "index.html",
                    "package.json",
                    "vite.config.js",
                    "src/main.jsx",
                    "src/App.jsx",
                    "src/styles.css",
                ],
            }

        return {
            "project_type": "classic_html",
            "managed_files": ["index.html", "styles.css", "script.js"],
        }

    def read_project_files(self, project_dir: Path) -> dict:
        project_dir = Path(project_dir)
        meta = self.get_project_meta(project_dir)
        files = {}
        for relative_path in meta["managed_files"]:
            target = self._resolve_path(project_dir, relative_path)
            files[relative_path] = target.read_text(encoding="utf-8")
        return files

    def write_project_files(self, project_dir: Path, files: dict, project_type: str = "classic_html") -> None:
        project_dir = Path(project_dir)
        normalized_type = self._normalize_project_type(project_type)
        clean_files = {k: v for k, v in files.items() if k != "summary"}

        for relative_path, content in clean_files.items():
            target = self._resolve_path(project_dir, relative_path)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")

        self._ensure_runtime_files(project_dir, normalized_type)
        self._write_manifest(project_dir, normalized_type, clean_files)

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
