"""Claude Vision provider via Anthropic SDK."""

import base64
from anthropic import AsyncAnthropic
from .base import AIProvider, AnalysisResult
from . import ProviderRegistry


@ProviderRegistry.register("claude")
class ClaudeProvider(AIProvider):
    name = "claude"

    def __init__(self, api_key: str):
        self.client = AsyncAnthropic(api_key=api_key)

    async def analyze(self, image_data, image_mime_type, system_prompt, user_context, model):
        base64_image = base64.b64encode(image_data).decode("utf-8")

        content = []
        if user_context:
            content.append({"type": "text", "text": user_context})
        else:
            content.append({"type": "text", "text": "请分析这张图片"})

        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": image_mime_type,
                "data": base64_image,
            },
        })

        return await self._send(system_prompt, content, model)

    async def analyze_video(self, frames, system_prompt, user_context, model):
        content = [{"type": "text", "text": user_context or "请分析这些从视频中提取的关键帧"}]

        for i, (frame_bytes, mime_type) in enumerate(frames):
            b64 = base64.b64encode(frame_bytes).decode("utf-8")
            content.append({
                "type": "image",
                "source": {"type": "base64", "media_type": mime_type, "data": b64},
            })

        return await self._send(system_prompt, content, model)

    async def _send(self, system_prompt, content, model):
        response = await self.client.messages.create(
            model=model,
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": content}],
        )

        text = ""
        for block in response.content:
            if block.type == "text":
                text += block.text

        tokens = response.usage.input_tokens + response.usage.output_tokens

        return AnalysisResult(
            text=text,
            model=response.model,
            provider_name="claude",
            tokens_used=tokens,
        )

    async def analyze_text(self, system_prompt, user_context, model):
        return await self._send(system_prompt, user_context, model)
