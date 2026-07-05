"""OpenAI GPT-4V provider via OpenAI SDK."""

import base64
from openai import AsyncOpenAI
from .base import AIProvider, AnalysisResult
from . import ProviderRegistry


@ProviderRegistry.register("openai")
class OpenAIProvider(AIProvider):
    name = "openai"

    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def analyze(self, image_data, image_mime_type, system_prompt, user_context, model):
        b64 = base64.b64encode(image_data).decode("utf-8")
        content = [
            {"type": "text", "text": user_context or "请分析这张图片"},
            {"type": "image_url", "image_url": {"url": f"data:{image_mime_type};base64,{b64}", "detail": "auto"}},
        ]
        return await self._send(system_prompt, content, model)

    async def analyze_video(self, frames, system_prompt, user_context, model):
        content = [{"type": "text", "text": user_context or "请分析这些从视频中提取的关键帧"}]
        for frame_bytes, mime_type in frames:
            b64 = base64.b64encode(frame_bytes).decode("utf-8")
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{b64}", "detail": "auto"},
            })
        return await self._send(system_prompt, content, model)

    async def _send(self, system_prompt, content, model):
        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content},
            ],
            max_tokens=4096,
        )
        return AnalysisResult(
            text=response.choices[0].message.content or "",
            model=response.model,
            provider_name="openai",
            tokens_used=response.usage.total_tokens if response.usage else None,
        )

    async def analyze_text(self, system_prompt, user_context, model):
        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_context},
            ],
            max_tokens=4096,
        )
        return AnalysisResult(
            text=response.choices[0].message.content or "",
            model=response.model,
            provider_name="openai",
            tokens_used=response.usage.total_tokens if response.usage else None,
        )
