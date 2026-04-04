import json
import os
import re
from textwrap import dedent

from .plan import WebsitePlan


class LLMService:
    """Handles Gemini 2.5 Flash interactions through LangChain."""

    def __init__(self) -> None:
        try:
            from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_google_genai import ChatGoogleGenerativeAI
        except ModuleNotFoundError as exc:
            raise ValueError(
                "Missing dependencies. Install: langchain langchain-core langchain-google-genai pydantic"
            ) from exc

        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GOOGLE_API_KEY is not set.")

        self.ChatPromptTemplate = ChatPromptTemplate
        self.JsonOutputParser = JsonOutputParser
        self.StrOutputParser = StrOutputParser

        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            temperature=0.3,
        )

    @staticmethod
    def _parse_json_object(raw: str) -> dict:
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

    def create_website_plan(self, user_prompt: str) -> dict:
        parser = self.JsonOutputParser(pydantic_object=WebsitePlan)
        prompt = self.ChatPromptTemplate.from_template(
            dedent(
                """
                You are a senior web product planner.
                Convert the user request into a strict JSON object.

                User request:
                {user_prompt}

                JSON schema rules:
                {format_instructions}
                """
            ).strip()
        )

        chain = prompt | self.model | parser
        return chain.invoke(
            {
                "user_prompt": user_prompt,
                "format_instructions": parser.get_format_instructions(),
            }
        )

    def generate_website_files(self, user_prompt: str, plan: dict) -> dict:
        prompt = self.ChatPromptTemplate.from_template(
            dedent(
                """
                You are an expert frontend engineer.
                Build a modern single-page website from the request and plan.

                User prompt:
                {user_prompt}

                Plan JSON:
                {plan_json}

                Output only a valid JSON object with this exact shape:
                {{
                  "index.html": "...",
                  "styles.css": "...",
                  "script.js": "..."
                }}

                Requirements:
                - Use plain HTML/CSS/JS.
                - Link styles.css and script.js from index.html.
                - Keep it production-ready and responsive.
                - No markdown fences.
                """
            ).strip()
        )

        chain = prompt | self.model | self.StrOutputParser()
        raw = chain.invoke({"user_prompt": user_prompt, "plan_json": json.dumps(plan)})
        return self._parse_json_object(raw)

    def apply_website_changes(self, files: dict, user_message: str) -> dict:
        prompt = self.ChatPromptTemplate.from_template(
            dedent(
                """
                You are a senior frontend engineer applying requested edits.

                User requested change:
                {user_message}

                Current files:
                {files_json}

                Return only JSON with this exact shape:
                {{
                  "index.html": "...",
                  "styles.css": "...",
                  "script.js": "...",
                  "summary": "1-2 sentence summary of what changed"
                }}

                Rules:
                - Apply the requested change directly to the files.
                - You must make at least one concrete change when a change is requested.
                - Keep existing structure unless the request requires larger changes.
                - Ensure output stays valid HTML/CSS/JS.
                - No markdown fences.
                """
            ).strip()
        )

        chain = prompt | self.model | self.StrOutputParser()
        raw = chain.invoke(
            {
                "user_message": user_message,
                "files_json": json.dumps(files),
            }
        )
        result = self._parse_json_object(raw)

        for key in ("index.html", "styles.css", "script.js"):
            if key not in result:
                raise ValueError(f"Missing '{key}' in updated files.")

        return result

    def chat_about_site(self, site_snapshot: str, user_message: str) -> str:
        prompt = self.ChatPromptTemplate.from_template(
            dedent(
                """
                You are a website assistant.
                Website snapshot may include HTML/CSS/JS.
                Give practical guidance based on this context.

                Website snapshot:
                {site_snapshot}

                User message:
                {user_message}
                """
            ).strip()
        )

        chain = prompt | self.model | self.StrOutputParser()
        return chain.invoke(
            {
                "site_snapshot": site_snapshot[:25000],
                "user_message": user_message,
            }
        )
