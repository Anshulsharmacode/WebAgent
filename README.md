backend/
│
├── manage.py
├── requirements.txt
├── .env
│
├── core/ # Django project (config layer)
│ ├── **init**.py
│ ├── settings.py
│ ├── urls.py
│ ├── asgi.py
│ └── wsgi.py
│
├── apps/ # All business logic grouped by domain
│ ├── **init**.py
│
│ ├── agents/ # 🧠 AI agents (LLM logic)
│ │ ├── **init**.py
│ │ ├── planner.py
│ │ ├── backend_generator.py
│ │ ├── frontend_generator.py
│ │ ├── devops_generator.py
│ │ ├── debug_agent.py
│ │ └── tools.py
│ │
│ ├── execution/ # 🐳 Run code (Docker + terminal)
│ │ ├── **init**.py
│ │ ├── docker_manager.py
│ │ ├── process_runner.py
│ │ ├── logs_streamer.py
│ │ └── container_utils.py
│ │
│ ├── files/ # 📂 File system operations
│ │ ├── **init**.py
│ │ ├── file_writer.py
│ │ ├── file_reader.py
│ │ ├── project_builder.py
│ │ └── templates_loader.py
│ │
│ ├── sessions/ # 🧾 Session management
│ │ ├── **init**.py
│ │ ├── models.py
│ │ ├── views.py
│ │ ├── serializers.py
│ │ ├── urls.py
│ │ └── services.py
│ │
│ ├── chat/ # 💬 Chat with generated app
│ │ ├── **init**.py
│ │ ├── chat_agent.py
│ │ ├── tools.py
│ │ ├── views.py
│ │ ├── serializers.py
│ │ └── urls.py
│ │
│ └── api/ # 🌐 Main API entrypoints
│ ├── **init**.py
│ ├── views.py
│ ├── serializers.py
│ └── urls.py
│
├── utils/ # 🔧 Shared helpers
│ ├── **init**.py
│ ├── logger.py
│ ├── env.py
│ ├── constants.py
│ └── helpers.py
│
└── sandbox/ # ⚠️ Generated apps (runtime)
└── sessions/
└── {session_id}/
├── backend/
├── frontend/
└── docker-compose.yml
