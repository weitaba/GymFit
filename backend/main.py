"""GymFit AI — FastAPI application entry point."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

load_dotenv()

# Import providers to trigger @ProviderRegistry.register decorators
import providers.claude   # noqa: F401
import providers.openai   # noqa: F401
import providers.bailian  # noqa: F401
from providers import ProviderRegistry

from config.loader import get_config_loader
from cache import result_cache

from routers import detection, analyze, diet

REFERENCE_DIR = Path(__file__).parent.parent / "reference"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    loader = get_config_loader()
    print(f"[startup] Loaded {loader.total} detection types in categories: {loader.categories()}")
    available = ProviderRegistry.available()
    print(f"[startup] Available AI providers: {available or 'NONE'}")
    await result_cache.start_cleanup()
    yield
    # Shutdown
    await result_cache.stop_cleanup()


app = FastAPI(
    title="GymFit AI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(detection.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(diet.router, prefix="/api")

# Serve reference videos and frame dumps as static files
if REFERENCE_DIR.is_dir():
    app.mount("/api/reference", StaticFiles(directory=str(REFERENCE_DIR)), name="reference")

_frames_dir = Path(__file__).parent.parent / "frames_dump"
_frames_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/frames", StaticFiles(directory=str(_frames_dir)), name="frames")


@app.get("/api/health")
async def health():
    loader = get_config_loader()
    return {
        "status": "ok",
        "version": "1.0.0",
        "providers": ProviderRegistry.available(),
        "detection_types": loader.total,
    }


@app.get("/api/reference-list/{type_id}")
async def reference_list(type_id: str):
    """List available reference media organized by checkpoint."""
    type_dir = REFERENCE_DIR / type_id
    if not type_dir.is_dir():
        return {"type_id": type_id, "checkpoints": []}

    checkpoints = []
    for cp_dir in sorted(type_dir.iterdir()):
        if not cp_dir.is_dir() or cp_dir.name.startswith("."):
            continue
        items = []
        for f in sorted(cp_dir.iterdir()):
            if f.suffix.lower() in (".mp4", ".webm", ".mov", ".jpg", ".jpeg", ".png", ".webp") and not f.name.startswith("."):
                items.append({
                    "name": f.stem,
                    "url": f"/api/reference/{type_id}/{cp_dir.name}/{f.name}",
                    "is_video": f.suffix.lower() in (".mp4", ".webm", ".mov"),
                })
        if items:
            checkpoints.append({
                "id": cp_dir.name,
                "label": cp_dir.name,
                "items": items,
            })

    return {"type_id": type_id, "checkpoints": checkpoints}
