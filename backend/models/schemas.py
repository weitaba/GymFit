"""Pydantic schemas for API request/response models."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# --- Detection Type ---

class DetectionTypeSummary(BaseModel):
    id: str
    name: str
    category: str
    description: str
    instructions: str
    tags: list[str] = []
    angles: list[dict] = []
    output_format: dict = {}
    input_fields: list[str] = []


class DetectionTypeListResponse(BaseModel):
    types: list[DetectionTypeSummary]
    total: int
    category: Optional[str] = None


# --- Analysis ---

class AnalysisResultResponse(BaseModel):
    id: str
    detection_type_id: str
    detection_type_name: str
    category: str
    result: str
    provider_used: str
    model_used: str
    created_at: str


# --- Diet / Text-based Analysis ---

class DietRecommendRequest(BaseModel):
    diet_type_id: str
    user_input: dict = Field(default_factory=dict)
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None
