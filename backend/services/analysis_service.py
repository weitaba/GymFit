"""Orchestrates analysis: validate → load config → select provider → call AI → cache."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile

from config.loader import get_config_loader
from providers import ProviderRegistry
from cache import result_cache
from video_utils import extract_frames, find_reference_frames
from video_strategies import get_strategy


IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}
VIDEO_MIME = {"video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"}
ALLOWED_MIME = IMAGE_MIME | VIDEO_MIME
MAX_IMAGE = 10 * 1024 * 1024       # 10 MB
MAX_VIDEO = 50 * 1024 * 1024       # 50 MB

_DEFAULT_VISION_MODELS = {
    "claude": "claude-sonnet-4-20250514",
    "openai": "gpt-4o",
    "bailian": "qwen-vl-max",
}
_DEFAULT_TEXT_MODELS = {
    "claude": "claude-sonnet-4-20250514",
    "openai": "gpt-4o",
    "bailian": "qwen-max",
}


def _default_model_for(provider_key: str, vision: bool = True) -> str:
    models = _DEFAULT_VISION_MODELS if vision else _DEFAULT_TEXT_MODELS
    return models.get(provider_key, "gpt-4o")


def _resolve_provider(provider_name: str | None):
    key = provider_name or ProviderRegistry.get_default_name()
    if not key:
        raise HTTPException(status_code=500, detail={"detail": "未配置 AI Provider", "error_code": "NO_PROVIDER"})
    if key not in ProviderRegistry.available():
        raise HTTPException(status_code=503, detail={"detail": f"Provider '{key}' 不可用", "error_code": "PROVIDER_UNAVAILABLE"})
    return key


async def _read_file(file: UploadFile) -> tuple[bytes, str]:
    contents = await file.read()
    is_video = (file.content_type or "") in VIDEO_MIME
    max_size = MAX_VIDEO if is_video else MAX_IMAGE
    if len(contents) > max_size:
        limit = "50MB" if is_video else "10MB"
        raise HTTPException(status_code=413, detail={"detail": f"文件大小不能超过 {limit}", "error_code": "FILE_TOO_LARGE"})
    return contents, file.content_type or "application/octet-stream"


async def analyze_media(
    detection_type_id: str,
    uploads: list[tuple[UploadFile, str]],  # (file, angle_label)
    description: str | None = None,
    provider_name: str | None = None,
    model: str | None = None,
    api_key: str | None = None,
) -> dict:
    loader = get_config_loader()
    config = loader.get(detection_type_id)
    if config is None:
        raise HTTPException(status_code=404, detail=f"检测类型 '{detection_type_id}' 不存在")
    if config.category not in ("posture", "movement"):
        raise HTTPException(status_code=400, detail={"detail": "该类型不支持图片/视频分析", "error_code": "WRONG_CATEGORY"})

    provider_key = _resolve_provider(provider_name)
    if model is None:
        model = config.models.recommended.get(provider_key) or _default_model_for(provider_key, vision=True)

    # Process uploads — use rep detection for videos, single frame for images
    all_frames: list[tuple[bytes, str, str]] = []  # (data, mime, label)
    angle_summary: list[str] = []

    for file, angle in uploads:
        mime = file.content_type or ""
        if mime not in ALLOWED_MIME:
            raise HTTPException(status_code=400, detail={
                "detail": f"不支持的文件格式: {mime}", "error_code": "INVALID_FILE_TYPE"})

        file_bytes, mime_type = await _read_file(file)
        is_video = mime in VIDEO_MIME

        if config.category == "posture" and is_video:
            raise HTTPException(status_code=400, detail={"detail": "体态检测仅支持图片上传", "error_code": "VIDEO_NOT_ALLOWED"})

        if is_video:
            strategy = get_strategy(config.extraction_strategy)
            labeled_frames = strategy.extract(file_bytes)
            all_frames.extend(labeled_frames)
            angle_summary.append(f"{angle}（{config.extraction_strategy or '默认'}策略，{len(labeled_frames)} 帧）")
        else:
            all_frames.append((file_bytes, mime_type, f"{angle}"))
            angle_summary.append(f"{angle}（图片）")

    # Load all reference frames from checkpoint directories
    ref_frames: list[tuple[bytes, str, str]] = find_reference_frames(config.id)

    # Build context
    parts = ["已提供的拍摄角度：\n" + "\n".join(f"- {a}" for a in angle_summary)]

    if ref_frames:
        parts.append(f"\n标准参照（{len(ref_frames)} 帧，覆盖 7 项检测）：")
        parts.append("用户动作帧是一次完整动作中等距抽取的 10 帧。请在回复中使用视角名称（俯拍/正面拍/侧面拍）而非帧编号来描述问题。")
        parts.append("请将用户帧与对应检测项的标准参照逐项对比。")

    if description:
        parts.append(f"\n用户补充说明: {description}")

    full_context = "\n".join(parts)

    # Reference frames first, then user frames
    all_render_frames = [(d, m) for d, m, _ in ref_frames] + [(d, m) for d, m, _ in all_frames]

    provider = ProviderRegistry.create(provider_key, api_key)
    try:
        if len(all_render_frames) > 1:
            result = await provider.analyze_video(
                frames=all_render_frames,
                system_prompt=config.system_prompt,
                user_context=full_context,
                model=model,
            )
        else:
            fb, fm = all_render_frames[0]
            result = await provider.analyze(
                image_data=fb,
                image_mime_type=fm,
                system_prompt=config.system_prompt,
                user_context=full_context,
                model=model,
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail={"detail": f"AI 分析失败: {str(e)}", "error_code": "AI_PROVIDER_ERROR"})

    result_id = str(uuid.uuid4())[:8]
    return {
        "id": result_id,
        "detection_type_id": config.id,
        "detection_type_name": config.name,
        "category": config.category,
        "result": result.text,
        "provider_used": result.provider_name,
        "model_used": result.model,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


async def analyze_diet(
    diet_type_id: str,
    user_input: dict,
    provider_name: str | None = None,
    model: str | None = None,
) -> dict:
    loader = get_config_loader()
    config = loader.get(diet_type_id)
    if config is None:
        raise HTTPException(status_code=404, detail=f"饮食方案类型 '{diet_type_id}' 不存在")
    if config.category != "diet":
        raise HTTPException(status_code=400, detail={"detail": "该类型不是饮食方案", "error_code": "WRONG_CATEGORY"})

    parts = []
    for field in config.input_fields:
        val = user_input.get(field)
        if val is not None:
            parts.append(f"- {field}: {', '.join(str(v) for v in val) if isinstance(val, list) else val}")
    extra = user_input.get("extra", "")
    if extra:
        parts.append(f"\n额外需求: {extra}")
    user_context = "用户信息：\n" + "\n".join(parts)

    provider_key = _resolve_provider(provider_name)
    if model is None:
        model = config.models.recommended.get(provider_key) or _default_model_for(provider_key, vision=False)

    provider = ProviderRegistry.create(provider_key)
    try:
        result = await provider.analyze_text(
            system_prompt=config.system_prompt,
            user_context=user_context,
            model=model,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail={"detail": f"AI 分析失败: {str(e)}", "error_code": "AI_PROVIDER_ERROR"})

    result_id = str(uuid.uuid4())[:8]
    return {
        "id": result_id,
        "detection_type_id": config.id,
        "detection_type_name": config.name,
        "category": config.category,
        "result": result.text,
        "provider_used": result.provider_name,
        "model_used": result.model,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


async def estimate_food(food: str, amount: str, provider_name: str | None = None, model: str | None = None, api_key: str | None = None) -> dict:
    """Use AI to estimate nutrition for a food item."""
    provider_key = provider_name or _resolve_provider(None)
    provider = ProviderRegistry.create(provider_key, api_key)
    if not model:
        model = _default_model_for(provider_key, vision=False)

    prompt = f"""你是一个专业的营养数据库。请估算以下食物的营养成分，只返回 JSON，不要其他文字：

食物：{food}
份量：{amount}

返回格式：
{{"name": "食物名", "amount": "份量", "calories": 热量kcal, "protein": 蛋白质g, "carbs": 碳水g, "fat": 脂肪g, "note": "估算依据说明"}}

注意：
- 如果是模糊描述（如"一个拳头大小"、"半碗"），按常规份量估算
- 鸡胸肉等生熟重量要区分，默认按熟重估算
- 即使某项为 0（如鸡胸肉的碳水为0），也要写 0，不要省略
- 只返回 JSON"""

    result = await provider.analyze_text(
        system_prompt="你是一个营养数据库。只返回JSON。",
        user_context=prompt,
        model=model,
    )

    import json, re
    text = result.text.strip()
    # Extract JSON from markdown code blocks if present
    m = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if m:
        text = m.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"name": food, "amount": amount, "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "note": "AI 解析失败"}


async def cache_set(key: str, value: dict):
    await result_cache.set(key, value)


async def get_cached_result(result_id: str) -> dict | None:
    return await result_cache.get(result_id)
