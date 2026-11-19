---
name: chalk-research
description: Research and fact-check the numbers for a ChalkTalk data episode (rankings, country comparisons, "top 10 by X") and write research/<slug>.md with a source and year for every figure. Use before writing any ChalkTalk episode.json, or when the user questions a number.
---

# Research the numbers for a ChalkTalk episode

Comparison channels live or die on accuracy. Every number on the board needs a source and a year.

## 1. Pick ONE metric and ONE source family
- Rank by a single, clearly named metric (`"metric": "Total aircraft"`, not "air power").
- Prefer one primary source for the whole ranking so numbers are comparable
  (e.g. Global Firepower, IISS Military Balance, SIPRI, World Bank, IMF, UN, CIA World Factbook, OECD).
- Mixing sources across countries makes the ranking meaningless. If you must, say so in the notes.
- Use the latest edition; record its year as `asOf`.

## 2. Gather
- Use WebSearch/WebFetch where available. If the network blocks it, say so and ask the user for
  the figures or a source file — **never invent or "remember" numbers and present them as checked**.
- Capture: rank, country, ISO-2 code, value, unit, source name, edition/year, URL.
- Secondary stats (for `stats[1..]` or `sayLong` facts) follow the same rule.

## 3. Write `research/<slug>.md`
```markdown
# <Title> — research
Metric: <exact definition>   Source: <name, edition>   As of: <year>   Retrieved: <date>

| # | Country | ISO | Value | Source / URL | Notes |
|---|---------|-----|-------|--------------|-------|

## Disputed / caveats
- e.g. "GFP counts trainers and helicopters; IISS combat-aircraft numbers differ."

## Script facts (for sayLong)
- one checked fact per country, with source
```

## 4. Check with the user
Show the table. Only after the user confirms, set `"verified": true` in episode.json.
Put the sources into `sources` — the outro writes them on the board, and they go in the video description.

## Sensitive topics
Military, GDP, population etc. are fine. Keep narration neutral and factual: no taunting countries,
no claims about who would "win a war". Rankings measure one number; say what it measures.
