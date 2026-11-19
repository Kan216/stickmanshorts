#!/usr/bin/env python3
"""
Original, royalty-free background music for ChalkTalk — composed in code (numpy only),
so there is nothing to license and no Content ID risk.

  python3 scripts/gen-music.py            # → public/music/chalk-curious.wav (Shorts)
                                           #   public/music/chalk-documentary.wav (long-form)

Tracks are loop-safe (whole bars, no tail) and normalised to ~-20 LUFS; the video
mix sets the final level and ducks the music under the narrator.
"""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/music"
rng = np.random.default_rng(7)  # deterministic

NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def hz(name: str) -> float:
    """'A3' → 220.0"""
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[n] + 12 * (o + 1) - 69) / 12)


def t(sec: float) -> np.ndarray:
    return np.arange(int(sec * SR)) / SR


def onepole_lp(x: np.ndarray, cutoff: float) -> np.ndarray:
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):  # only used on short one-shots
        acc += a * (v - acc)
        y[i] = acc
    return y


# ---------------- instruments (one-shots, cached) ----------------

def kick(gain=1.0):
    tt = t(0.35)
    f = 45 + 75 * np.exp(-tt * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return gain * np.sin(ph) * np.exp(-tt * 9)


def snare(gain=1.0):
    tt = t(0.22)
    n = rng.uniform(-1, 1, tt.size)
    n = n - onepole_lp(n, 1200)  # high-passed noise
    body = 0.5 * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 30)
    return gain * (0.7 * n * np.exp(-tt * 18) + body)


def hat(gain=1.0, open_=False):
    tt = t(0.18 if open_ else 0.05)
    n = rng.uniform(-1, 1, tt.size)
    n = n - onepole_lp(n, 6000)
    return gain * n * np.exp(-tt * (14 if open_ else 70))


def shaker(gain=1.0):
    tt = t(0.09)
    n = rng.uniform(-1, 1, tt.size)
    n = n - onepole_lp(n, 4500)
    env = np.sin(np.pi * np.clip(tt / 0.09, 0, 1)) ** 2
    return gain * n * env


def marimba(f, dur=0.6, gain=1.0):
    tt = t(dur)
    s = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 4 * tt) * np.exp(-tt * 18)
    return gain * s * np.exp(-tt * 6.5) * np.minimum(1, tt / 0.003)


def piano(f, dur=1.6, gain=1.0):
    tt = t(dur)
    s = sum((0.6 ** k) * np.sin(2 * np.pi * f * (k + 1) * tt * (1 + 0.0004 * k)) for k in range(5))
    env = np.exp(-tt * 2.6) * np.minimum(1, tt / 0.004)
    return gain * s * env


def bass(f, dur, gain=1.0):
    tt = t(dur)
    s = np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2 * f * tt)
    env = np.minimum(1, tt / 0.01) * np.minimum(1, (dur - tt) / 0.06) * np.exp(-tt * 1.2)
    return gain * s * env


def pad(freqs, dur, gain=1.0):
    tt = t(dur)
    s = np.zeros_like(tt)
    for f in freqs:
        for det in (-0.12, 0.12):  # slow chorus
            ff = f * 2 ** (det / 12)
            s += sum((1 / (k + 1)) * np.sin(2 * np.pi * ff * (k + 1) * tt) for k in range(4))
    env = np.minimum(1, tt / 0.6) * np.minimum(1, (dur - tt) / 0.6)
    return gain * s / (len(freqs) * 4) * env


# ---------------- arrangement helpers ----------------

class Track:
    def __init__(self, bars: int, bpm: float):
        self.bpm = bpm
        self.beat = 60 / bpm
        self.len = int(bars * 4 * self.beat * SR)
        self.L = np.zeros(self.len)
        self.R = np.zeros(self.len)

    def add(self, sound: np.ndarray, at_beats: float, pan=0.0):
        i = int(at_beats * self.beat * SR)
        if i >= self.len:
            return
        n = min(sound.size, self.len - i)
        self.L[i : i + n] += sound[:n] * (1 - max(0, pan))
        self.R[i : i + n] += sound[:n] * (1 + min(0, pan))
        # wrap the tail to the start → seamless loop
        if sound.size > n:
            rest = sound[n:]
            self.L[: rest.size] += rest * (1 - max(0, pan))
            self.R[: rest.size] += rest * (1 + min(0, pan))

    def write(self, path: Path):
        st = np.stack([self.L, self.R], axis=1)
        st /= max(1e-9, np.abs(st).max()) / 0.89
        pcm = (st * 32767).astype(np.int16)
        tmp = path.with_suffix(".raw.wav")
        with wave.open(str(tmp), "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        # gentle glue + loudness normalisation (ffmpeg)
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af",
             "acompressor=threshold=0.25:ratio=2.5:attack=15:release=200,loudnorm=I=-20:TP=-2:LRA=9", "-ar", str(SR), str(path)],
            check=True,
        )
        tmp.unlink()
        print(f"{path.relative_to(ROOT)}  {self.len / SR:.1f}s @ {self.bpm} BPM")


# ---------------- tracks ----------------

def curious():
    """Shorts: light, curious explainer groove. Am–F–C–G, 104 BPM, 32 bars (~74 s)."""
    tr = Track(32, 104)
    prog = [("A2", ["A3", "C4", "E4"]), ("F2", ["F3", "A3", "C4"]), ("C2", ["C3", "E3", "G3"]), ("G2", ["G3", "B3", "D4"])]
    melody = [  # (beat offset in 2-bar phrase, note) — call & answer motif
        (0, "E5"), (0.5, "C5"), (1, "A4"), (2, "B4"), (2.5, "C5"), (3.5, "E5"),
        (4, "D5"), (4.5, "C5"), (5, "A4"), (6, "G4"), (7, "A4"),
    ]
    K, S, H, HO = kick(1.0), snare(0.55), hat(0.25), hat(0.2, True)
    for bar in range(32):
        b0 = bar * 4
        root, chord = prog[bar % 4]
        section = bar // 8  # 0 intro, 1 groove, 2 groove+melody, 3 groove+melody (var)
        tr.add(pad([hz(n) for n in chord], 4 * tr.beat, 0.55 if section == 0 else 0.4), b0)
        if section >= 1:
            for b in (0, 2.5):
                tr.add(K, b0 + b)
            for b in (1, 3):
                tr.add(S, b0 + b)
            for e in range(8):
                tr.add(HO if e == 7 else H, b0 + e * 0.5, pan=0.3)
            for b, dur in ((0, 1.5), (1.5, 0.5), (2, 1.5), (3.5, 0.5)):
                note = hz(root) * (2 if b == 3.5 else 1)
                tr.add(bass(note, dur * tr.beat * 0.95, 0.75), b0 + b)
        else:
            tr.add(K, b0)
            for e in range(4):
                tr.add(H * 0.6, b0 + e + 0.5, pan=0.3)
        if section >= 2:
            phrase_bar = bar % 2
            for off, n in melody:
                if int(off // 4) == phrase_bar:
                    f = hz(n) * (2 if section == 3 and off in (0, 4) else 1)
                    tr.add(marimba(f, 0.55, 0.42), b0 + (off % 4), pan=-0.25)
        else:
            # sparse plucked arpeggio so the intro isn't empty
            for i, n in enumerate(chord):
                tr.add(marimba(hz(n) * 2, 0.5, 0.25), b0 + i * 0.75 + 0.5, pan=-0.2)
    tr.write(OUT / "chalk-curious.wav")


def documentary():
    """Long-form: calm, warm, curious. C–G–Am–F with piano arpeggios, 88 BPM, 48 bars (~131 s)."""
    tr = Track(48, 88)
    prog = [("C2", ["C4", "E4", "G4"]), ("G1", ["B3", "D4", "G4"]), ("A1", ["A3", "C4", "E4"]), ("F1", ["A3", "C4", "F4"])]
    K, SH = kick(0.6), shaker(0.25)
    for bar in range(48):
        b0 = bar * 4
        root, chord = prog[bar % 4]
        section = bar // 16  # 0 soft, 1 + rhythm, 2 + top line
        tr.add(pad([hz(n) / 2 for n in chord], 4 * tr.beat, 0.5), b0)
        tr.add(bass(hz(root), 3.8 * tr.beat, 0.6), b0)
        arp = [chord[0], chord[1], chord[2], chord[1], chord[0], chord[1], chord[2], chord[1]]
        for i, n in enumerate(arp):
            tr.add(piano(hz(n), 1.4, 0.28 if i % 2 else 0.36), b0 + i * 0.5, pan=-0.15)
        if section >= 1:
            tr.add(K, b0)
            tr.add(K * 0.7, b0 + 2.5)
            for e in range(8):
                tr.add(SH * (1.0 if e % 2 else 0.6), b0 + e * 0.5, pan=0.35)
        if section == 2 and bar % 2 == 0:
            top = {0: "G5", 1: "D5", 2: "E5", 3: "C5"}[(bar // 2) % 4]
            tr.add(piano(hz(top), 2.5, 0.3), b0 + 0, pan=0.2)
            tr.add(piano(hz(top) * 2 ** (-2 / 12), 2.0, 0.22), b0 + 3, pan=0.2)
    tr.write(OUT / "chalk-documentary.wav")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    curious()
    documentary()
