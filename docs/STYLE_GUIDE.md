# Style Guide — the visual language

Distilled from studying successful "visual mindset" stickman shorts (see `references/README.md`).
These are *principles*, not a copy of any channel — keep your own name, palettes and ideas.

## 1. Format
- **9:16, 720×1280, 30fps.** Length **12–25s** for single-metaphor shorts; **45–65s** for a
  "series" short (e.g. 7 chapters × 8s). Loops well when the last frame resembles the first.
- **No voice-over.** The story is told by motion + 3–8 words of on-screen text per beat.
- Music bed + punctual SFX on every meaningful action (step, hit, count, reveal).

## 2. Composition (720×1280)
```
  0 ┌──────────────────────┐
    │  HEADLINE (y≈90-150) │  ← 1 line, 38–52px, ALL CAPS, one keyword coloured
200 │  STATS / COUNTERS    │  ← labels 22–26px coloured, values 40–76px mono/bold
    │                      │
    │   (air / glow /      │  ← secondary objects: tree, thought cloud, light orb
    │    secondary prop)   │
    │                      │
    │   CHARACTERS + PROPS │  ← hero height 200–330px, feet on y=905
905 ├──────────────────────┤  ← ground line (thin steel line)
975 │   • • •  CHANNEL     │  ← tiny watermark + chapter dots
    │   (floor, empty)     │  ← platform UI covers this — nothing important here
1280└──────────────────────┘
```
- Characters live in the **middle band (y 450–905)**; text lives in the **top band (y 60–300)**.
- Center of interest slightly above center. Never put text below y≈1000.
- Use **lanes** (2–3 columns) for comparisons; one centred hero for metaphors.

## 3. Colour
- Background: near-black (`#000`–`#151020`) vertical gradient + soft ambient radial glow behind
  the action in the scene's accent colour (low opacity). Subtle twinkling dust.
- **One accent colour per character/idea**, used for: the figure, its label, its lane light,
  its keyword in the headline. Viewers learn "teal = Talent" in 1 second.
- Gold/amber = success, payoff, wisdom. Red = anger/ego/danger. Teal/green = talent/envy/life.
  Steel blue = discipline/calm. Orange = ego/drive. Pink/magenta = desire. Grey/dim = lost/quit.
- "Losers" fade: lower opacity + glow, grey their stat (`dim: true`).
- Payoff moment: warm light floods in (Spotlight + Particles + stronger glow + `ding`).

## 4. Characters
- **neon**: coloured outline tube with dark core + glow — default, most versatile.
- **solid**: thick filled limbs, dark outline, expressive eyes — for "cast of characters" comparisons.
- **silhouette**: black figures in lit interiors (bedroom, room scenes, emotional stories).
- **line**: thin minimal — metaphors, crowds, background figures.
- Faces = **eyes only** (neutral, angry, sad, happy, closed, dead). Emotion comes from pose + eyes.
- Back limbs dimmer than front limbs (depth). Subtle `breathe()` on every idle character.

## 5. Text
- ALL CAPS, heavy sans (800), short: "TALENT GOT BORED." "DAY ONE." "BOW."
- Colour exactly one keyword with the character's colour: `"{teal:TALENT} GOT BORED."`
- Headline changes per beat: **question hook → developments → verdict → punchline/question.**
- End with either a **question to the viewer** ("WHICH ONE ARE YOU?") or a **2-line maxim**
  ("SMALL FEARS / NEED BIG PEOPLE." with line 2 in gold).
- Counters tick visibly (`countUp`) — numbers are the "plot" of the short.
- Typewriter (`mode="type"`) for intimate/night stories; `pop` for energetic comparisons.

## 6. Motion
- Ease everything (`ease.inOut`/`ease.out`); springs for pops. No linear moves except walking travel.
- One main action at a time; secondary motion (breathing, particles, flicker) everywhere else.
- Hold the final frame ≥ 2s so the punchline can be read; consider a seamless loop.
- Stagger: when 3 characters do the same thing, offset by 3–8 frames.
- Big beats get a micro camera move (scale 1→1.04) or `shake()` and a `boom`/`thud`.

## 7. Recurring formats (pick one per short)
| Format | Shape | Example idea |
|---|---|---|
| **Versus lanes** | 2–3 characters, same task, counters; one by one they quit | Talent vs Discipline vs Ego on a pull-up bar |
| **A/B split screen** | top half vs bottom half, same situation, one variable changed | child alone vs child with parent at 2am |
| **Chapter series** | N chapters, each a colour + label bar + vignette, progress object fills | 7 deadly sins; 5 stages of grief |
| **Metaphor object** | one object = abstract idea (chain = past, stairs = progress, target = chances) | "THE PAST" weight drowning a swimmer |
| **Counter flip** | big number grows while hero is stuck, then a different counter starts | DAYS WAITING 365 → STEPS TAKEN 8 |
| **Compilation** | 3 mini-metaphors × 8s, shared maxim style | archery / chain / stairs |
