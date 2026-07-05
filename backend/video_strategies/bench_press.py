"""Bench press: frame differencing to detect first rep, then 10 even frames."""

import os
import time
import cv2
import numpy as np
from .base import ExtractionStrategy

SAMPLE_EVERY = 3
COMPARE_SIZE = 64
SMOOTH_WINDOW = 3
VALLEY_RATIO = 0.35
FRAMES_DUMP_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frames_dump")


class BenchPressStrategy(ExtractionStrategy):

    def extract(self, video_bytes: bytes) -> list[tuple[bytes, str, str]]:
        ts = time.strftime("%H%M%S")
        dump_dir = os.path.join(FRAMES_DUMP_DIR, f"user_{ts}")

        rep = self._detect_first_rep(video_bytes)
        path = "/tmp/_gymfit_video_tmp.mp4"
        with open(path, "wb") as f:
            f.write(video_bytes)

        cap = cv2.VideoCapture(path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        start_idx = rep["start_idx"] if rep else int(total * 0.05)
        end_idx = rep["end_idx"] if rep else int(total * 0.95)
        usable = max(end_idx - start_idx, 10)

        n = 10
        result = []
        for i in range(n):
            idx = start_idx + int(usable * (i + 0.5) / n)
            cap.set(cv2.CAP_PROP_POS_FRAMES, min(idx, total - 1))
            ret, frame = cap.read()
            if ret:
                jpeg, mime = self._to_jpeg(frame)
                label = f"frame_{i + 1:02d}"
                result.append((jpeg, mime, label))
                self._dump(frame, label, dump_dir)

        cap.release()
        print(f"[frames] bench_press: rep {start_idx}-{end_idx}, {len(result)} frames → {dump_dir}")
        return result

    def _detect_first_rep(self, video_bytes: bytes) -> dict | None:
        frames, _ = self._sample_frames(video_bytes)
        if len(frames) < 8:
            return None

        diffs = self._diff_signal(frames)
        threshold = max(diffs) * VALLEY_RATIO

        valleys = []
        for i in range(1, len(diffs) - 1):
            if diffs[i] < threshold and diffs[i] <= diffs[i - 1] and diffs[i] <= diffs[i + 1]:
                if valleys and i - valleys[-1] <= 2:
                    if diffs[i] < diffs[valleys[-1]]:
                        valleys[-1] = i
                else:
                    valleys.append(i)

        if len(valleys) >= 2:
            return {"start_idx": frames[valleys[0]][0], "end_idx": frames[valleys[1]][0]}
        return {"start_idx": frames[len(frames) // 10][0], "end_idx": frames[-len(frames) // 10][0]}

    def _sample_frames(self, video_bytes: bytes):
        path = "/tmp/_gymfit_bp_sample.mp4"
        with open(path, "wb") as f:
            f.write(video_bytes)
        cap = cv2.VideoCapture(path)
        frames = []
        idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if idx % SAMPLE_EVERY == 0:
                frames.append((idx, frame))
            idx += 1
        cap.release()
        return frames, cap.get(cv2.CAP_PROP_FPS)

    def _diff_signal(self, frames):
        small = []
        for _, f in frames:
            gray = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
            small.append(cv2.resize(gray, (COMPARE_SIZE, COMPARE_SIZE)).astype(np.float32))
        diffs = []
        for i in range(1, len(small)):
            diffs.append(np.mean((small[i] - small[i - 1]) ** 2))
        diffs = np.array(diffs)
        if diffs.max() > 0:
            diffs = diffs / diffs.max()
        if len(diffs) >= SMOOTH_WINDOW:
            diffs = np.convolve(diffs, np.ones(SMOOTH_WINDOW) / SMOOTH_WINDOW, mode='same')
        return diffs

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
