import json
import os
import re
from typing import Any, List, Optional

import litellm
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from pydantic import BaseModel

from .prompts import (
    APPLY_WEBSITE_CHANGES_PROMPT,
    CHAT_ABOUT_SITE_PROMPT,
    CLASSIC_EDIT_OUTPUT_SHAPE,
    CLASSIC_EDIT_RULES,
    CLASSIC_OUTPUT_SHAPE,
    CLASSIC_REQUIREMENTS,
    GENERATE_WEBSITE_FILES_PROMPT,
    REACT_EDIT_OUTPUT_SHAPE,
    REACT_EDIT_RULES,
    REACT_OUTPUT_SHAPE,
    REACT_REQUIREMENTS,
)


class ChatLiteLLM(BaseChatModel):
    """Custom LangChain Chat Model wrapper around LiteLLM for multi-provider support."""

    model_name: str = "gemini/gemini-2.5-flash"
    api_key: Optional[str] = None
    temperature: float = 0.3

    @property
    def _llm_type(self) -> str:
        return "litellm"

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        formatted_messages = []
        for m in messages:
            role = "user"
            if m.type in ("system", "developer"):
                role = "system"
            elif m.type in ("ai", "assistant"):
                role = "assistant"
            formatted_messages.append({"role": role, "content": m.content})

        completion_kwargs: dict[str, Any] = {
            "model": self.model_name,
            "messages": formatted_messages,
            "temperature": self.temperature,
        }
        if self.api_key:
            completion_kwargs["api_key"] = self.api_key
        if stop:
            completion_kwargs["stop"] = stop

        response = litellm.completion(**completion_kwargs)

        content = ""
        if hasattr(response, "choices") and response.choices:
            choice = response.choices[0]
            if hasattr(choice, "message") and choice.message:
                msg_content = getattr(choice.message, "content", "")
                if msg_content is not None:
                    content = msg_content if isinstance(msg_content, str) else json.dumps(msg_content)
            elif isinstance(choice, dict):
                msg = choice.get("message", {})
                msg_content = msg.get("content", "")
                if msg_content is not None:
                    content = msg_content if isinstance(msg_content, str) else json.dumps(msg_content)

        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=str(content)))])


class LLMService:
    """Handles LLM interactions through LangChain and LiteLLM across multiple providers."""

    SUPPORTED_PROJECT_TYPES = {"classic_html", "react"}
    CLASSIC_FILES = ("index.html", "styles.css", "script.js")
    REACT_FILES = (
        "index.html",
        "package.json",
        "vite.config.js",
        "src/main.jsx",
        "src/App.jsx",
        "src/styles.css",
    )

    def __init__(self, api_key: str | None = None, model_name: str | None = None) -> None:
        try:
            from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
            from langchain_core.prompts import ChatPromptTemplate
        except ModuleNotFoundError as exc:
            raise ValueError(
                "Missing dependencies. Install: langchain langchain-core litellm pydantic"
            ) from exc

        resolved_api_key = (
            api_key
            or os.getenv("GOOGLE_API_KEY")
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("ANTHROPIC_API_KEY")
        )

        raw_model = model_name or "gemini-2.5-flash"
        if raw_model.startswith("gemini-") and not raw_model.startswith("gemini/"):
            resolved_model = f"gemini/{raw_model}"
        else:
            resolved_model = raw_model

        self.ChatPromptTemplate = ChatPromptTemplate
        self.JsonOutputParser = JsonOutputParser
        self.StrOutputParser = StrOutputParser

        self.model = ChatLiteLLM(
            model_name=resolved_model,
            api_key=resolved_api_key,
            temperature=0.3,
        )

    @classmethod
    def normalize_project_type(cls, project_type: str | None) -> str:
        value = (project_type or "classic_html").strip().lower().replace("-", "_")
        if value not in cls.SUPPORTED_PROJECT_TYPES:
            raise ValueError("project_type must be one of: classic_html, react")
        return value

    @classmethod
    def required_files_for_type(cls, project_type: str) -> tuple[str, ...]:
        normalized = cls.normalize_project_type(project_type)
        return cls.REACT_FILES if normalized == "react" else cls.CLASSIC_FILES

    @staticmethod
    def _parse_json_object(raw: Any) -> dict:
        if isinstance(raw, dict):
            return raw
        if isinstance(raw, BaseModel):
            return raw.model_dump()
        if not isinstance(raw, str):
            raw = str(raw)

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", raw, flags=re.DOTALL)
        if fenced:
            return json.loads(fenced.group(1))

        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(raw[start : end + 1])

        raise ValueError("Model did not return valid JSON.")

    def should_apply_changes(self, user_message: str) -> bool:
        """
        Determines if user wants code changes applied to their website
        or if they are purely asking an informational question.
        """
        text = user_message.strip().lower()

        # 1. Action Verbs & Key UI Elements -> Apply Mode (True)
        action_verbs = {
            "add", "change", "update", "fix", "remove", "make", "set", "replace",
            "create", "style", "modify", "build", "design", "refactor", "put",
            "turn", "convert", "align", "center", "hide", "show", "increase",
            "decrease", "adjust", "move", "rename", "delete", "use", "improve",
            "edit", "rewrite", "color", "background", "text", "font", "header",
            "footer", "button", "layout", "nav", "navbar", "hero", "card", "theme"
        }
        words = set(re.findall(r"\b\w+\b", text))
        if words.intersection(action_verbs):
            return True

        # 2. Pure Informational Question Prefixes without action -> Consultation Mode (False)
        question_prefixes = ("what is", "why is", "how does", "what should", "explain", "tell me about")
        if text.startswith(question_prefixes):
            return False

        # Default to applying changes for user messages in website copilot
        return True


    async def stream_chat_about_site(self, site_snapshot: str, user_message: str):
        """Streams conversational AI responses / suggestions back to the user."""
        prompt_str = CHAT_ABOUT_SITE_PROMPT.format(
            site_snapshot=site_snapshot[:25000],
            user_message=user_message,
        )

        response = await litellm.acompletion(
            model=self.model.model_name,
            api_key=self.model.api_key,
            messages=[{"role": "user", "content": prompt_str}],
            temperature=0.3,
            stream=True,
        )

        async for chunk in response:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                yield delta



    async def stream_generate_website_files(self, user_prompt: str, project_type: str = "classic_html"):
        normalized_type = self.normalize_project_type(project_type)
        output_shape = REACT_OUTPUT_SHAPE if normalized_type == "react" else CLASSIC_OUTPUT_SHAPE
        requirements = REACT_REQUIREMENTS if normalized_type == "react" else CLASSIC_REQUIREMENTS

        prompt_str = GENERATE_WEBSITE_FILES_PROMPT.format(
            project_type=normalized_type,
            user_prompt=user_prompt,
            output_shape=output_shape,
            requirements=requirements,
        )

        response = await litellm.acompletion(
            model=self.model.model_name,
            api_key=self.model.api_key,
            messages=[{"role": "user", "content": prompt_str}],
            temperature=0.3,
            stream=True,
        )

        full_content = ""
        async for chunk in response:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                full_content += delta
                yield delta, None

        result = self._parse_json_object(full_content)
        for key in self.required_files_for_type(normalized_type):
            if key not in result:
                raise ValueError(f"Missing '{key}' in generated files.")
        yield "", result

    async def stream_apply_website_changes(self, files: dict, user_message: str, project_type: str = "classic_html"):
        normalized_type = self.normalize_project_type(project_type)
        required_files = self.required_files_for_type(normalized_type)
        output_shape = REACT_EDIT_OUTPUT_SHAPE if normalized_type == "react" else CLASSIC_EDIT_OUTPUT_SHAPE
        rules = REACT_EDIT_RULES if normalized_type == "react" else CLASSIC_EDIT_RULES

        prompt_str = APPLY_WEBSITE_CHANGES_PROMPT.format(
            project_type=normalized_type,
            user_message=user_message,
            files_json=json.dumps(files),
            output_shape=output_shape,
            rules=rules,
        )

        response = await litellm.acompletion(
            model=self.model.model_name,
            api_key=self.model.api_key,
            messages=[{"role": "user", "content": prompt_str}],
            temperature=0.3,
            stream=True,
        )

        full_content = ""
        async for chunk in response:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                full_content += delta
                yield delta, None

        result = self._parse_json_object(full_content)
        merged_files = dict(files)
        for k, v in result.items():
            if k != "summary":
                merged_files[k] = v
        if "summary" in result:
            merged_files["summary"] = result["summary"]
        yield "", merged_files


