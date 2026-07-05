"""Pydantic models for detection type config validation."""

from pydantic import BaseModel, Field
from typing import Literal


class ModelRecommendations(BaseModel):
    recommended: dict[str, str] = Field(default_factory=dict)


class DetectionTypeConfig(BaseModel):
    """Full validated config for one detection type."""

    id: str = Field(..., pattern=r"^[a-z0-9_]+$")
    name: str
    category: Literal["posture", "movement", "diet"]
    description: str
    instructions: str = ""
    system_prompt: str
    output_format: dict[str, str | dict] = Field(default_factory=dict)
    input_fields: list[str] = Field(default_factory=list)
    extraction_strategy: str = ""
    angles: list[dict] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    models: ModelRecommendations = Field(default_factory=ModelRecommendations)
    enabled: bool = True
