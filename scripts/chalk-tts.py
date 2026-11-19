#!/usr/bin/env python3
"""
ChalkTalk voice-over: episode.json → edge-tts audio + word timings.

  python3 scripts/chalk-tts.py top10-air-forces            # both formats
  python3 scripts/chalk-tts.py top10-air-forces --format short
  python3 scripts/chalk-tts.py top10-air-forces --only 3   # regenerate one scene (index in episode.scenes)

Writes, per format:
  public/chalk/<slug>/<format>/s<NN>.mp3
  public/chalk/<slug>/<format>/timing.json   ← Remotion reads this to time every scene
Also copies the flags the episode uses into public/flags/.

Needs: pip install edge-tts, ffprobe, and network access to speech.platform.bing.com.
Uses $HTTPS_PROXY automatically if set (cloud containers).
"""
import argparse
import asyncio
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    sys.exit("edge-tts missing: pip install edge-tts")

ROOT = Path(__file__).resolve().parent.parent
# cloud containers: trust the agent proxy's CA (no effect elsewhere)
if not os.environ.get("SSL_CERT_FILE") and Path("/root/.ccr/ca-bundle.crt").exists():
    os.environ["SSL_CERT_FILE"] = "/root/.ccr/ca-bundle.crt"
TICKS = 10_000_000  # edge-tts offsets are in 100ns units

# Words edge-tts says wrong → what to send instead (captions keep the original text).
PRONOUNCE: dict[str, str] = {}


def say_for(scene: dict, fmt: str) -> str:
    return scene.get("sayLong") if fmt == "long" and scene.get("sayLong") else scene["say"]


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


async def synth(text: str, voice: str, rate: str, pitch: str, mp3: Path, tries: int = 5) -> list[dict]:
    """The service occasionally drops a request (NoAudioReceived) — retry with backoff."""
    for attempt in range(tries):
        try:
            return await _synth(text, voice, rate, pitch, mp3)
        except (edge_tts.exceptions.NoAudioReceived, OSError) as e:
            if attempt == tries - 1:
                raise
            print(f"    retry {attempt + 1} ({type(e).__name__})")
            await asyncio.sleep(1.5 * (attempt + 1))
    return []


async def _synth(text: str, voice: str, rate: str, pitch: str, mp3: Path) -> list[dict]:
    spoken = text
    for k, v in PRONOUNCE.items():
        spoken = spoken.replace(k, v)
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    com = edge_tts.Communicate(spoken, voice, rate=rate, pitch=pitch, boundary="WordBoundary", proxy=proxy)
    words: list[dict] = []
    with open(mp3, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "w": chunk["text"],
                    "t": round(chunk["offset"] / TICKS, 3),
                    "d": round(chunk["duration"] / TICKS, 3),
                })
    return words


def attach_punctuation(words: list[dict], text: str) -> list[dict]:
    """edge-tts drops punctuation from boundary text; put it back so captions can break on it."""
    pos = 0
    for w in words:
        i = text.find(w["w"], pos)
        if i < 0:
            continue
        j = i + len(w["w"])
        while j < len(text) and text[j] in ".,!?;:'\"":
            j += 1
        w["w"] = text[i:j]
        pos = j
    return words


async def run(slug: str, formats: list[str], only: int | None) -> None:
    ep_path = ROOT / "src/chalk/episodes" / slug / "episode.json"
    ep = json.loads(ep_path.read_text())
    voice = ep["voice"]["name"]

    # flags
    flags_src = ROOT / "node_modules/flag-icons/flags/4x3"
    (ROOT / "public/flags").mkdir(parents=True, exist_ok=True)
    for s in ep["scenes"]:
        if s.get("country"):
            src = flags_src / f"{s['country'].lower()}.svg"
            if src.exists():
                shutil.copy(src, ROOT / "public/flags" / src.name)
            else:
                print(f"⚠️  no flag for {s['country']} (npm install?)")

    for fmt in formats:
        out_dir = ROOT / "public/chalk" / slug / fmt
        out_dir.mkdir(parents=True, exist_ok=True)
        timing_path = out_dir / "timing.json"
        old = json.loads(timing_path.read_text()) if timing_path.exists() else {"scenes": []}
        old_by_idx = {s["index"]: s for s in old.get("scenes", [])}
        rate = ep["voice"].get("rateLong" if fmt == "long" else "rateShort", "+0%")
        pitch = ep["voice"].get("pitch", "+0Hz")
        scenes = []
        for idx, s in enumerate(ep["scenes"]):
            if s.get("only") and s["only"] != fmt:
                continue
            text = say_for(s, fmt)
            mp3 = out_dir / f"s{idx:02d}.mp3"
            if only is not None and idx != only and idx in old_by_idx and mp3.exists():
                scenes.append(old_by_idx[idx])
                continue
            words = await synth(text, voice, rate, pitch, mp3)
            words = attach_punctuation(words, text)
            dur = probe_duration(mp3)
            scenes.append({
                "index": idx,
                "audio": f"chalk/{slug}/{fmt}/{mp3.name}",
                "duration": round(dur, 3),
                "text": text,
                "words": words,
            })
            print(f"  [{fmt}] s{idx:02d} {dur:5.2f}s  {text[:60]}")
        timing = {"format": fmt, "voice": voice, "rate": rate, "scenes": scenes}
        timing_path.write_text(json.dumps(timing, indent=1))
        total = sum(s["duration"] for s in scenes)
        print(f"✅ {fmt}: {len(scenes)} scenes, {total:.1f}s of narration → {timing_path.relative_to(ROOT)}")
        if fmt == "short" and total > 55:
            print("⚠️  short narration is over 55s — trim lines or raise rateShort (Shorts cap is 60s)")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--format", choices=["short", "long", "both"], default="both")
    ap.add_argument("--only", type=int, help="regenerate one scene index only")
    a = ap.parse_args()
    fmts = ["short", "long"] if a.format == "both" else [a.format]
    asyncio.run(run(a.slug, fmts, a.only))


if __name__ == "__main__":
    main()
