"""Abstract base for video extraction strategies."""

from abc import ABC, abstractmethod


class ExtractionStrategy(ABC):
    """Each exercise type can have its own rep detection and frame extraction logic."""

    @abstractmethod
    def extract(self, video_bytes: bytes) -> list[tuple[bytes, str, str]]:
        """
        Extract key frames from a video.

        Returns list of (frame_bytes, mime_type, label).
        Labels are descriptive, e.g. "frame_01" through "frame_10".
        """
        ...
