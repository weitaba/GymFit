"""Default: evenly-spaced frame extraction (no rep detection)."""

import os
import time
import cv2
from .base import ExtractionStrategy

FRAMES_DUMP_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frames_dump")


class DefaultStrategy(ExtractionStrategy):

    def extract(self, video_bytes: bytes) -> list[tuple[bytes, str, str]]:
        ts = time.strftime("%H%M%S")
        dump_dir = os.path.join(FRAMES_DUMP_DIR, f"user_{ts}")

        path = "/tmp/_gymfit_default_tmp.mp4"
        with open(path, "wb") as f:
            f.write(video_bytes)

        cap = cv2.VideoCapture(path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        n = 10
        start = int(total * 0.05)
        end = int(total * 0.95)
        usable = max(end - start, n)

        result = []
        for i in range(n):
            idx = start + int(usable * (i + 0.5) / n)
            cap.set(cv2.CAP_PROP_POS_FRAMES, min(idx, total - 1))
            ret, frame = cap.read()
            if ret:
                jpeg, mime = self._to_jpeg(frame)
                label = f"frame_{i + 1:02d}"
                result.append((jpeg, mime, label))
                self._dump(frame, label, dump_dir)

        cap.release()
        print(f"[frames] default: {len(result)} frames → {dump_dir}")
        return result

    def _to_jpeg(self, frame):
        h, w = frame.shape[:2]
        if max(h, w) > 1568:
            scale = 1568 / max(h, w)
            frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
        _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return jpeg.tobytes(), "image/jpeg"

    def _dump(self, frame, label, dump_dir):
        os.makedirs(dump_dir, exist_ok=True)
        cv2.imwrite(os.path.join(dump_dir, f"{label}.jpg"), frame)
