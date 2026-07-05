"""GET detection type list and detail."""

from fastapi import APIRouter, HTTPException
from services.detection_service import list_detection_types, get_detection_type_detail

router = APIRouter()


@router.get("/detection-types")
async def get_types(category: str | None = None):
    return list_detection_types(category)


@router.get("/detection-types/{type_id}")
async def get_type(type_id: str):
    detail = get_detection_type_detail(type_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"检测类型 '{type_id}' 不存在")
    return detail
