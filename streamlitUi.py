import json
from urllib import error, request

import streamlit as st
import streamlit.components.v1 as components


st.set_page_config(
    page_title="Website Agent Chat Studio",
    page_icon="W",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
            --bg0: #071424;
            --bg1: #0f2740;
            --card: rgba(13, 30, 50, 0.78);
            --ink: #eaf4ff;
            --muted: #a3b6cb;
            --accent: #5ef2c5;
            --accent2: #ffd58b;
            --border: rgba(163, 182, 203, 0.28);
        }

        .stApp {
            background:
              radial-gradient(1200px 650px at 0% -10%, rgba(94,242,197,0.14), transparent),
              radial-gradient(900px 600px at 100% 0%, rgba(255,213,139,0.13), transparent),
              linear-gradient(135deg, var(--bg0), var(--bg1));
            color: var(--ink);
            font-family: 'Outfit', sans-serif;
        }

        .block-container {
            max-width: 1180px;
            padding-top: 1rem;
            padding-bottom: 1.8rem;
        }

        .hero {
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 1rem 1.25rem;
            background: linear-gradient(120deg, rgba(94,242,197,0.16), rgba(255,213,139,0.09));
            margin-bottom: 0.8rem;
        }

        .hero p {
            color: var(--muted);
            margin: 0.35rem 0 0;
        }

        .stTextInput input,
        .stTextArea textarea,
        .stNumberInput input {
            background: rgba(5, 17, 32, 0.7) !important;
            border: 1px solid var(--border) !important;
            color: var(--ink) !important;
            border-radius: 10px !important;
        }

        .stButton > button {
            border-radius: 10px;
            border: 1px solid rgba(94,242,197,0.7);
            background: linear-gradient(140deg, rgba(94,242,197,0.2), rgba(94,242,197,0.08));
            color: #f3fffb;
            font-weight: 650;
        }

        .stTabs [data-baseweb="tab"] {
            border: 1px solid var(--border);
            border-radius: 9px;
            background: rgba(255,255,255,0.03);
            color: var(--ink);
        }

        .stTabs [aria-selected="true"] {
            border-color: rgba(94,242,197,0.95) !important;
            box-shadow: 0 0 0 1px rgba(94,242,197,0.45) inset;
        }

        div[data-testid="stMetric"] {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 0.4rem 0.8rem;
        }

        code {
            font-family: 'JetBrains Mono', monospace;
        }
    </style>
    """,
    unsafe_allow_html=True,
)


if "api_base" not in st.session_state:
    st.session_state.api_base = "http://localhost:8000/llm"
if "last_build" not in st.session_state:
    st.session_state.last_build = {}
if "active_site_url" not in st.session_state:
    st.session_state.active_site_url = ""
if "preview_token" not in st.session_state:
    st.session_state.preview_token = 0
if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
        {
            "role": "assistant",
            "text": "Create a website from sidebar, then ask changes here like: make the theme warm orange and improve CTA button.",
        }
    ]


def post_json(url: str, payload: dict, timeout: int = 180):
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url=url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body), resp.status
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8") if exc.fp else ""
        try:
            return json.loads(body), exc.code
        except json.JSONDecodeError:
            return {"error": body or str(exc)}, exc.code
    except Exception as exc:
        return {"error": str(exc)}, 0


def fetch_html(url: str, timeout: int = 20):
    try:
        with request.urlopen(url, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="ignore"), ""
    except Exception as exc:
        return "", str(exc)


st.markdown(
    """
    <div class="hero">
      <h2 style="margin:0;">Website Agent Chat Studio</h2>
      <p>Generate a website, chat to apply edits, preview instantly, and inspect code.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.sidebar:
    st.header("Build Controls")
    st.session_state.api_base = st.text_input("Backend base URL", value=st.session_state.api_base)
    timeout_sec = st.slider("API timeout (sec)", min_value=20, max_value=600, value=180, step=10)

    st.markdown("### Prompt to Website")
    prompt = st.text_area(
        "Website prompt",
        height=170,
        placeholder="Build a startup landing page for AI healthcare with hero, features, pricing, testimonials, and FAQ.",
    )
    project_name = st.text_input("Project name", placeholder="ai-healthcare")
    use_custom_port = st.checkbox("Use custom port", value=False)
    port = st.number_input("Port", min_value=1025, max_value=65535, value=13000, disabled=not use_custom_port)

    if st.button("Generate + Run", use_container_width=True):
        if not prompt.strip():
            st.warning("Prompt is required.")
        else:
            payload = {"prompt": prompt.strip()}
            if project_name.strip():
                payload["project_name"] = project_name.strip()
            if use_custom_port:
                payload["port"] = int(port)

            with st.spinner("Generating website and starting Docker container..."):
                result, status = post_json(f"{st.session_state.api_base.rstrip('/')}/build/", payload, timeout=timeout_sec)

            if 200 <= status < 300:
                st.session_state.last_build = result
                st.session_state.active_site_url = result.get("site_url", "")
                st.session_state.preview_token += 1
                st.session_state.chat_history = [
                    {
                        "role": "assistant",
                        "text": "Website is live. Ask for any changes and I will apply them automatically.",
                    }
                ]
                st.success("Website generated successfully.")
            else:
                st.error(result.get("error", "Build failed."))

    st.caption("API endpoints: /build/, /chat/, /stop/")


build = st.session_state.last_build
if build:
    c1, c2, c3 = st.columns(3)
    c1.metric("Project", build.get("plan", {}).get("name", "generated-site"))
    c2.metric("Port", str(build.get("host_port", "-")))
    c3.metric("Container", build.get("container_name", "-"))


chat_tab, preview_tab, code_tab, manage_tab = st.tabs(["Chatbot", "Preview", "Code", "Manage"])

with chat_tab:
    st.subheader("Website Chat")

    current_url = st.session_state.active_site_url or (build.get("site_url", "") if build else "")
    st.caption(f"Connected site: `{current_url or 'Not connected yet'}`")

    for item in st.session_state.chat_history:
        with st.chat_message(item["role"]):
            st.markdown(item["text"])

    user_message = st.chat_input("Ask changes for your website...")
    if user_message:
        st.session_state.chat_history.append({"role": "user", "text": user_message})

        with st.chat_message("user"):
            st.markdown(user_message)

        if not build or not current_url:
            err = "Generate website first from sidebar."
            st.session_state.chat_history.append({"role": "assistant", "text": err})
            with st.chat_message("assistant"):
                st.error(err)
        else:
            with st.spinner("Applying changes to website..."):
                result, status = post_json(
                    f"{st.session_state.api_base.rstrip('/')}/chat/",
                    {
                        "site_url": current_url,
                        "message": user_message,
                        "apply_changes": True,
                        "project_dir": build.get("project_dir"),
                        "project_name": build.get("plan", {}).get("name"),
                        "container_name": build.get("container_name"),
                    },
                    timeout=timeout_sec,
                )

            if 200 <= status < 300:
                answer = result.get("answer", "Updated.")
                summary = result.get("change_summary", "")

                if result.get("changes_applied"):
                    st.session_state.last_build.update(
                        {
                            "container_name": result.get("container_name", build.get("container_name")),
                            "container_id": result.get("container_id", build.get("container_id")),
                            "site_url": result.get("site_url", build.get("site_url")),
                            "host_port": result.get("host_port", build.get("host_port")),
                            "image_tag": result.get("image_tag", build.get("image_tag")),
                            "generated_files": result.get("generated_files", build.get("generated_files", {})),
                        }
                    )
                    st.session_state.active_site_url = st.session_state.last_build.get("site_url", current_url)
                    st.session_state.preview_token += 1

                final_msg = answer if not summary else f"{answer}\n\nChange summary: {summary}"
                st.session_state.chat_history.append({"role": "assistant", "text": final_msg})
                with st.chat_message("assistant"):
                    st.markdown(final_msg)
            else:
                err = result.get("error", "Chat/update failed.")
                st.session_state.chat_history.append({"role": "assistant", "text": f"Error: {err}"})
                with st.chat_message("assistant"):
                    st.error(err)

with preview_tab:
    st.subheader("Live Website Preview")

    site_url = st.session_state.active_site_url or (build.get("site_url", "") if build else "")
    if not site_url:
        st.info("Generate a website first to preview it.")
    else:
        st.markdown(f"Live URL: `{site_url}`")
        preview_mode = st.radio("Preview mode", ["Iframe", "Inline HTML"], horizontal=True)
        preview_height = st.slider("Preview height", 350, 1000, 560, 10)

        if preview_mode == "Iframe":
            sep = "&" if "?" in site_url else "?"
            preview_url = f"{site_url}{sep}v={st.session_state.preview_token}"
            components.iframe(preview_url, height=preview_height, scrolling=True)
        else:
            html, err = fetch_html(site_url)
            if err:
                st.error(f"Preview fetch failed: {err}")
            else:
                components.html(html, height=preview_height, scrolling=True)

with code_tab:
    st.subheader("Generated Source Code")

    generated_files = build.get("generated_files", {}) if build else {}
    if not generated_files:
        st.info("No code available yet. Generate a website or apply chat changes first.")
    else:
        names = ["index.html", "styles.css", "script.js"]
        tabs = st.tabs(names)
        for idx, name in enumerate(names):
            lang = "html" if name.endswith(".html") else "css" if name.endswith(".css") else "javascript"
            with tabs[idx]:
                st.code(generated_files.get(name, ""), language=lang, line_numbers=True)

with manage_tab:
    st.subheader("Container Management")

    if build:
        st.markdown(f"Container name: `{build.get('container_name', '')}`")
        st.markdown(f"Container id: `{build.get('container_id', '')}`")
    else:
        st.info("No active generated container in this session.")

    stop_target = st.text_input(
        "Container to stop",
        value=build.get("container_name", "") if build else "",
        placeholder="container_name or container_id",
    )

    if st.button("Stop Container", use_container_width=True):
        if not stop_target.strip():
            st.warning("Enter a container id or name.")
        else:
            result, status = post_json(
                f"{st.session_state.api_base.rstrip('/')}/stop/",
                {"container_name": stop_target.strip()},
                timeout=timeout_sec,
            )
            if 200 <= status < 300:
                st.success("Container stopped.")
            else:
                st.error(result.get("error", "Stop failed."))

st.caption("Run backend: python3 agent/manage.py runserver | Run UI: streamlit run streamlitUi.py")
