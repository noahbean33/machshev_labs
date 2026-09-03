# Electromagnetics — Deck Outlines

Structural outlines of the seven PDF decks in [`blog/electromagnetics/`](../../blog/electromagnetics).
Each file is a **coverage map** — section titles and sub-headings only — generated so you can
decide which topics to write original posts about.

## Attribution & scope

The source PDFs are third-party course slides watermarked **Engineering Funda**, carried on
essentially every page. These outlines deliberately capture structure rather than content, and
nothing here should be published verbatim. Use them as a syllabus for writing your own articles.

## Index

| Topic | Outline | Slides | Sections | Sub-topics |
|---|---|---:|---:|---:|
| Capacitor and Capacitance | [capacitor_and_capacitance_outline.md](capacitor_and_capacitance_outline.md) | 45 | 10 | 21 |
| Electrostatics | [electrostatics_outline.md](electrostatics_outline.md) | 114 | 34 | 29 |
| EM Waves | [em_waves_outline.md](em_waves_outline.md) | 26 | 9 | 8 |
| Magnetism | [magnetism_outline.md](magnetism_outline.md) | 70 | 23 | 37 |
| Smith Chart | [smith_chart_outline.md](smith_chart_outline.md) | 50 | 3 | 17 |
| Transmission Lines | [transmission_lines_outline.md](transmission_lines_outline.md) | 54 | 17 | 19 |
| Vector Analysis | [vector_analysis_outline.md](vector_analysis_outline.md) | 72 | 14 | 41 |
| **Total** | | **431** | **110** | **172** |

## How these were produced

Extracted with PyMuPDF. A heading is identified as a line at the top of a slide in a size
larger than that deck's modal body size; the deck's own *Outlines* contents pages supply
section topic lists. Marker glyphs (`❑`, `▪`) are **not** used as the deciding signal —
their meaning is inverted between decks (a section header in one, body prose in another).

`Smith+Chart.pdf` is the exception: it is an image deck whose titles are baked into banner
graphics and whose working is handwritten, so almost nothing is recoverable from its text
layer. Its outline was built by rendering the slides and reading them visually.
