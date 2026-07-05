"""Provider registry with decorator-based registration."""

import os
from typing import Type
from .base import AIProvider


class ProviderRegistry:
    """Registry + Factory for AI providers.

    Providers self-register via decorator:
        @ProviderRegistry.register("claude")
        class ClaudeProvider(AIProvider): ...
    """

    _registry: dict[str, Type[AIProvider]] = {}

    @classmethod
    def register(cls, name: str):
        def wrapper(provider_cls: Type[AIProvider]):
            cls._registry[name] = provider_cls
            return provider_cls
        return wrapper

    @classmethod
    def create(cls, name: str, api_key_override: str | None = None) -> AIProvider:
        if name not in cls._registry:
            raise ValueError(f"Unknown provider: {name}")
        provider_cls = cls._registry[name]
        if api_key_override:
            return provider_cls(api_key_override)
        if name == "claude":
            api_key = os.getenv("ANTHROPIC_API_KEY", "")
        elif name == "openai":
            api_key = os.getenv("OPENAI_API_KEY", "")
        elif name == "bailian":
            api_key = os.getenv("DASHSCOPE_API_KEY", "")
        else:
            raise ValueError(f"No API key configuration for provider: {name}")
        if not api_key:
            raise ValueError(f"API key not set for {name}")
        return provider_cls(api_key)

    @classmethod
    def available(cls) -> list[str]:
        available = []
        if "claude" in cls._registry and os.getenv("ANTHROPIC_API_KEY"):
            available.append("claude")
        if "openai" in cls._registry and os.getenv("OPENAI_API_KEY"):
            available.append("openai")
        if "bailian" in cls._registry and os.getenv("DASHSCOPE_API_KEY"):
            available.append("bailian")
        return available

    @classmethod
    def get_default_name(cls) -> str | None:
        default = os.getenv("DEFAULT_PROVIDER", "")
        if default and default in cls.available():
            return default
        avail = cls.available()
        return avail[0] if avail else None
