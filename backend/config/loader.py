"""YAML config loader: scans detection_types/ directory, validates, indexes."""

import yaml
from pathlib import Path
from .models import DetectionTypeConfig


class ConfigLoader:
    def __init__(self, config_root: Path):
        self.config_root = config_root
        self._cache: dict[str, DetectionTypeConfig] = {}
        self._by_category: dict[str, list[str]] = {}
        self._reload()

    def _reload(self):
        for yaml_file in sorted(self.config_root.rglob("*.yaml")):
            with open(yaml_file) as f:
                raw = yaml.safe_load(f)
            if raw is None:
                continue
            config = DetectionTypeConfig(**raw)
            if not config.enabled:
                continue
            self._cache[config.id] = config
            self._by_category.setdefault(config.category, []).append(config.id)

    def get(self, type_id: str) -> DetectionTypeConfig | None:
        return self._cache.get(type_id)

    def list_by_category(self, category: str | None = None) -> list[DetectionTypeConfig]:
        if category:
            ids = self._by_category.get(category, [])
            return [self._cache[i] for i in ids if i in self._cache]
        return list(self._cache.values())

    def categories(self) -> list[str]:
        return list(self._by_category.keys())

    @property
    def total(self) -> int:
        return len(self._cache)


_config_loader: ConfigLoader | None = None


def get_config_loader() -> ConfigLoader:
    global _config_loader
    if _config_loader is None:
        config_root = Path(__file__).parent / "detection_types"
        _config_loader = ConfigLoader(config_root)
    return _config_loader
