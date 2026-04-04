# Website Agent Builder

Build websites from prompts, run them in Docker, preview them, and modify them through chat.

## Features

- Prompt -> website generation (`index.html`, `styles.css`, `script.js`)
- Run generated site in Docker (Nginx)
- Chat endpoint to discuss site or apply code changes
- Streamlit UI for generation, preview, code inspection, and chat-driven updates

## Project Structure

```text
v0/
├── agent/
│   ├── manage.py
│   ├── requirements.txt
│   ├── agent/
│   │   ├── settings.py
│   │   └── urls.py
│   └── apps/
│       └── llm/
│           ├── urls.py
│           ├── views.py
│           └── service/
│               ├── llm.py
│               ├── service.py
│               ├── docker.py
│               ├── chat.py
│               └── plan.py
├── streamlitUi.py
└── README.md
```

## Requirements

- Python 3.10+
- Docker running locally
- Google Gemini API key

## Setup

### 1) Install dependencies

```bash
cd agent
pip install -r requirements.txt
```

### 2) Environment variables

Create `agent/.env` (or export in shell):

```env
GOOGLE_API_KEY=your_key_here
```

Current service uses `GOOGLE_API_KEY` (and optionally `GEMINI_API_KEY` if implemented in your latest local changes).

### 3) Run Django backend

From repo root (`v0/`):

```bash
python3 agent/manage.py runserver
```

### 4) Run Streamlit UI

From repo root (`v0/`):

```bash
streamlit run streamlitUi.py
```

## API Base URL

All LLM endpoints are under:

```text
http://localhost:8000/llm/
```

---

## Views / Endpoints (All)

These are the current views in `apps/llm/views.py`.

### 1) Build Website

- **URL:** `POST /llm/build/`
- **View:** `build_website`
- **Purpose:** Generate website files from prompt, create Docker image, run container.

Request body:

```json
{
  "prompt": "Create a portfolio website for a frontend engineer",
  "project_name": "portfolio",
  "port": 13234
}
```

`project_name` and `port` are optional.

Response (example):

```json
{
  "plan": {
    "name": "portfolio",
    "purpose": "...",
    "sections": ["hero", "projects", "contact"],
    "tone": "professional",
    "primary_color": "#1f6feb"
  },
  "project_dir": ".../agent/generated_sites/portfolio",
  "files": ["index.html", "styles.css", "script.js"],
  "generated_files": {
    "index.html": "...",
    "styles.css": "...",
    "script.js": "..."
  },
  "container_id": "...",
  "container_name": "llm-site-portfolio-1234",
  "image_tag": "llm-site-portfolio",
  "host_port": 13234,
  "site_url": "http://localhost:13234"
}
```

---

### 2) Chat Website

- **URL:** `POST /llm/chat/`
- **View:** `chat_website`
- **Purpose:** Chat about website and optionally apply changes to code + redeploy.

#### A) Chat only (no file changes)

```json
{
  "site_url": "http://localhost:13234",
  "message": "What can I improve in this landing page?"
}
```

#### B) Apply changes from chat (recommended)

```json
{
  "site_url": "http://localhost:13234",
  "message": "Change theme to warm orange and make CTA button rounded",
  "apply_changes": true,
  "project_dir": "/abs/path/to/agent/generated_sites/portfolio",
  "project_name": "portfolio",
  "container_name": "llm-site-portfolio-1234"
}
```

Response (apply mode example):

```json
{
  "answer": "Done. Updated CSS variables and button styles.",
  "changes_applied": true,
  "change_summary": "Primary palette switched to warm orange and CTA styles updated.",
  "generated_files": {
    "index.html": "...",
    "styles.css": "...",
    "script.js": "..."
  },
  "container_id": "...",
  "container_name": "llm-site-portfolio-5678",
  "image_tag": "llm-site-portfolio",
  "host_port": 13234,
  "site_url": "http://localhost:13234"
}
```

---

### 3) Stop Website

- **URL:** `POST /llm/stop/`
- **View:** `stop_website`
- **Purpose:** Stop and remove a running Docker container.

Request body:

```json
{
  "container_name": "llm-site-portfolio-5678"
}
```

(or `container_id`)

Response:

```json
{
  "status": "stopped"
}
```

---

## Quick cURL Examples

### Build

```bash
curl -X POST http://localhost:8000/llm/build/ \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Build a portfolio website","project_name":"portfolio","port":13234}'
```

### Chat + Apply Changes

```bash
curl -X POST http://localhost:8000/llm/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "site_url":"http://localhost:13234",
    "message":"Use dark navy background and neon accent buttons",
    "apply_changes":true,
    "project_dir":"/absolute/path/to/agent/generated_sites/portfolio",
    "project_name":"portfolio",
    "container_name":"llm-site-portfolio-1234"
  }'
```

### Stop

```bash
curl -X POST http://localhost:8000/llm/stop/ \
  -H "Content-Type: application/json" \
  -d '{"container_name":"llm-site-portfolio-1234"}'
```

## Streamlit Workflow

1. Generate website from sidebar prompt.
2. Go to `Chatbot` tab and ask for changes.
3. Backend applies edits and redeploys container.
4. `Preview` tab shows updated site.
5. `Code` tab shows updated source files.

## Troubleshooting

- `GOOGLE_API_KEY is not set`: set env variable and restart backend.
- Docker build/run errors: ensure Docker daemon is running.
- Chat responds but no visible style change: use `apply_changes=true`, pass valid `project_dir` and `container_name`, then refresh preview.
- Port conflicts: choose a different `port` in `/build/` request.

## Notes

- Generated websites are stored under `agent/generated_sites/`.
- This project is currently optimized for single-page static site generation.
