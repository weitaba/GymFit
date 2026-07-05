"""Business logic for detection type queries."""

from config.loader import get_config_loader
from models.schemas import DetectionTypeSummary


def list_detection_types(category: str | None = None) -> dict:
    loader = get_config_loader()
    configs = loader.list_by_category(category)
    types = [
        DetectionTypeSummary(
            id=c.id,
            name=c.name,
            category=c.category,
            description=c.description,
            instructions=c.instructions,
            tags=c.tags,
            output_format=c.output_format,
            input_fields=c.input_fields,
            angles=c.angles,
        )
        for c in configs
    ]
    return {
        "types": types,
        "total": len(types),
        "category": category,
    }


def get_detection_type_detail(type_id: str) -> DetectionTypeSummary | None:
    loader = get_config_loader()
    config = loader.get(type_id)
    if config is None:
        return None
    return DetectionTypeSummary(
        id=config.id,
        name=config.name,
        category=config.category,
        description=config.description,
        instructions=config.instructions,
        tags=config.tags,
        output_format=config.output_format,
        input_fields=config.input_fields,
        angles=config.angles,
    )
