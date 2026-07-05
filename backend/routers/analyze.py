"""POST image/video analysis and GET cached result."""

from typing import Annotated

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.analysis_service import analyze_media, get_cached_result, cache_set

router = APIRouter()


@router.post("/analyze")
async def analyze_endpoint(
    detection_type_id: Annotated[str, Form()],
    files: Annotated[list[UploadFile], File()] = [],
    angles: Annotated[str, Form()] = "",
    description: Annotated[str | None, Form()] = None,
    provider: Annotated[str | None, Form()] = None,
    model: Annotated[str | None, Form()] = None,
    api_key: Annotated[str | None, Form()] = None,
    # Legacy single-file support
    image: UploadFile | None = File(None),
):
    # Support legacy single-file upload
    uploads = files if files else []
    if image and image.filename:
        uploads = [image]
        if not angles:
            angles = "未知角度"

    if not uploads:
        raise HTTPException(status_code=400, detail={"detail": "请上传至少一个文件", "error_code": "MISSING_FILE"})

    angle_list = [a.strip() for a in angles.split(",") if a.strip()] if angles else []
    # Pad angle list if fewer labels than files
    while len(angle_list) < len(uploads):
        angle_list.append("未知角度")

    result = await analyze_media(
        detection_type_id=detection_type_id,
        uploads=list(zip(uploads, angle_list)),
        description=description,
        provider_name=provider,
        model=model,
        api_key=api_key,
    )
    await cache_set(result["id"], result)
    return result


@router.get("/results/{result_id}")
async def get_result(result_id: str):
    result = await get_cached_result(result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="结果不存在或已过期，请重新分析")
    return result
