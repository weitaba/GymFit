"""Reference frame loading and generic video helpers."""

import os
import cv2
import numpy as np

REFERENCE_ROOT = os.path.join(os.path.dirname(__file__), "..", "reference")
FRAMES_DUMP_DIR = os.path.join(os.path.dirname(__file__), "..", "frames_dump")


def _to_jpeg(frame: np.ndarray) -> tuple[bytes, str]:
    h, w = frame.shape[:2]
    if max(h, w) > 1568:
        scale = 1568 / max(h, w)
        frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
    _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return jpeg.tobytes(), "image/jpeg"


def _dump(frame: np.ndarray, label: str, dump_dir: str):
    os.makedirs(dump_dir, exist_ok=True)
    cv2.imwrite(os.path.join(dump_dir, f"{label}.jpg"), frame)


def find_reference_frames(type_id: str = "bench_press") -> list[tuple[bytes, str, str]]:
    """
    Scan all checkpoint directories for a given exercise type.
    Works for any type_id — just create reference/{type_id}/1-xxx/ directories.
    """
    type_dir = os.path.join(REFERENCE_ROOT, type_id)
    if not os.path.isdir(type_dir):
        return []

    frames = []
    for cp_dir in sorted(os.listdir(type_dir)):
        path = os.path.join(type_dir, cp_dir)
        if not os.path.isdir(path) or cp_dir.startswith("."):
            continue

        for fname in sorted(os.listdir(path)):
            if fname.startswith("."):
                continue
            fpath = os.path.join(path, fname)
            label = f"{cp_dir}-{os.path.splitext(fname)[0]}"
            ext = fname.lower().rsplit(".", 1)[-1] if "." in fname else ""

            try:
                if ext in ("jpg", "jpeg", "png", "webp"):
                    with open(fpath, "rb") as f:
                        data = f.read()
                    mime = f"image/{'jpeg' if ext == 'jpg' else ext}"
                    frames.append((data, mime, label))
                    img = cv2.imread(fpath)
                    if img is not None:
                        _dump(img, label, os.path.join(FRAMES_DUMP_DIR, "ref"))

                elif ext in ("mp4", "webm", "mov", "avi"):
                    cap = cv2.VideoCapture(fpath)
                    if cap.isOpened():
                        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                        if total > 0:
                            for i, pos in enumerate([0.1, 0.5, 0.9]):
                                cap.set(cv2.CAP_PROP_POS_FRAMES, int(total * pos))
                                ret, frame = cap.read()
                                if ret:
                                    jpeg, mime = _to_jpeg(frame)
                                    frames.append((jpeg, mime, f"{label}-{'起中末'[i]}"))
                        cap.release()
            except Exception:
                continue

    if frames:
        print(f"[ref] Loaded {len(frames)} reference frames for {type_id}")
    return frames


def extract_frames(
    video_bytes: bytes,
    max_frames: int = 10,
    min_interval_sec: float = 0.2,
) -> list[tuple[bytes, str]]:
    """Legacy: evenly-spaced frame extraction without labels."""
    path = "/tmp/_gymfit_legacy_tmp.mp4"
    with open(path, "wb") as f:
        f.write(video_bytes)

    cap = cv2.VideoCapture(path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    n = min(max_frames, max(4, total // int(min_interval_sec * 15)))
    start = int(total * 0.05)
    end = int(total * 0.95)
    usable = max(end - start, n)

    frames = []
    for i in range(n):
        idx = start + int(usable * (i + 0.5) / n)
        cap.set(cv2.CAP_PROP_POS_FRAMES, min(idx, total - 1))
        ret, frame = cap.read()
        if ret:
            frames.append(_to_jpeg(frame))
    cap.release()
    return frames
