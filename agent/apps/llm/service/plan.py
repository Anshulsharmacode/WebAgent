from pydantic import BaseModel, Field


class WebsitePlan(BaseModel):
    """Structured planning output for website generation."""

    name: str = Field(description="Short project name in kebab-case")
    purpose: str = Field(description="Main goal of the website")
    sections: list[str] = Field(default_factory=list, description="Page sections to include")
    tone: str = Field(default="professional", description="Visual/content tone")
    primary_color: str = Field(default="#1f6feb", description="Main brand color in HEX")
