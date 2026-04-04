# services/planner.py

from langchain.tools import tool

@tool
def create_website_plan(prompt: str) -> dict:
    """
    Create a structured website plan from user prompt.
    Includes pages, sections, and styles.
    """
    # This is just schema description, LLM will fill it
    return {
        "pages": [
            {
                "name": "home",
                "sections": [
                    {"type": "hero", "content": "text"},
                    {"type": "features", "items": []}
                ]
            }
        ],
        "styles": {
            "theme": "modern",
            "primary_color": "#000"
        }
    }