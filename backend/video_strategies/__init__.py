"""Strategy registry: maps extraction_strategy names to classes."""

from .base import ExtractionStrategy
from .bench_press import BenchPressStrategy
from .default import DefaultStrategy

_registry: dict[str, type[ExtractionStrategy]] = {
    "bench_press": BenchPressStrategy,
    "default": DefaultStrategy,
}


def get_strategy(name: str | None) -> ExtractionStrategy:
    """Get an extraction strategy by name. Falls back to DefaultStrategy."""
    cls = _registry.get(name or "", _registry["default"])
    return cls()
