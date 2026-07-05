"""AI Provider abstract base class and AnalysisResult."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class AnalysisResult:
    """Standardized result from any AI provider."""
    text: str
    model: str
    provider_name: str
    tokens_used: Optional[int] = None


class AIProvider(ABC):
    """Abstract interface for AI providers supporting vision and text analysis."""

    @abstractmethod
    async def analyze(
        self,
        image_data: bytes,
        image_mime_type: str,
        system_prompt: str,
        user_context: Optional[str],
        model: str,
    ) -> AnalysisResult:
        """Analyze an image with a vision-capable model."""
        ...

    @abstractmethod
    async def analyze_video(
        self,
        frames: list[tuple[bytes, str]],
        system_prompt: str,
        user_context: str | None,
        model: str,
    ) -> AnalysisResult:
        """Analyze a video (list of frame images) with a vision model."""
        ...

    @abstractmethod
    async def analyze_text(
        self,
        system_prompt: str,
        user_context: str,
        model: str,
    ) -> AnalysisResult:
        """Analyze text input (no image) with a text model."""
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider identifier, e.g. 'claude', 'openai'."""
        ...
