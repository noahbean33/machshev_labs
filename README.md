# Machshev Labs LLC — company website

Marketing site for **Machshev Labs LLC**, built from
[CEM_LLC_Company_Design.md](CEM_LLC_Company_Design.md) — the working design doc predates the
company's current name; the filename is left as-is since it's the source document, not site output.

Positioning: computational electromagnetics for seed-to-Series-B hardware startups — EMI/EMC,
SI/PI, and FCC pre-compliance, without a $50k enterprise CEM license.

Static HTML, CSS, and vanilla JS. No build step, no dependencies, no network calls.

## Logo

`images/company_logo.jpg` is the source lockup (icon + wordmark, white background). Two derived,
transparent-background assets are generated from it for use on the dark site:

- `images/logo-icon.png` — the circuit-M mark alone, used in the nav and footer brand
- `images/logo-full.png` — icon + "MACHSHEV LABS LLC" wordmark, generated but not yet placed on a page
- `images/favicon.png` — small version of the icon, used as the browser-tab icon

Regenerate them if `company_logo.jpg` changes — the crop boxes are tuned to that specific file:

```bash
python3 -c "
from PIL import Image
import numpy as np
im = Image.open('images/company_logo.jpg').convert('RGB')
a = np.array(im).astype(np.float32)
def to_transparent(crop, pad=24, hi=248.0, lo=190.0):
    h, w, _ = crop.shape
    b = crop.mean(axis=2)
    alpha = np.clip((hi - b) / (hi - lo), 0, 1) * 255
    img = Image.fromarray(np.dstack([crop, alpha]).astype(np.uint8), 'RGBA')
    canvas = Image.new('RGBA', (w+2*pad, h+2*pad), (0,0,0,0))
    canvas.paste(img, (pad, pad), img)
    return canvas
to_transparent(a[85:754, 436:1225], 30).save('images/logo-icon.png')
to_transparent(a[85:1000, 311:1448], 28).save('images/logo-full.png')
"
```

## Pages

| File | Contents |
| --- | --- |
| `index.html` | Hero with a live FCC Class B emissions pre-scan, the two-broken-options problem, three service tiers, sample Pass/Risk/Fail report, engagement flow, competitive comparison table, flywheel |
| `services.html` | Tier 2 (SI/PI & EMI sprints), Tier 3 (FCC pre-compliance & failure correlation), Tier 1 (roadmap, with why it isn't shipped), pricing |
| `resources.html` | Three working calculators, EMI autopsy teasers, KiCad/Altium plugin status |
| `about.html` | Mission, who it's for and isn't for, how we work, services-then-software rationale, founder |
| `contact.html` | Hardware-startup intake form with client-side validation, what-happens-next, FAQ |
| `blog.html` | Index of both blog series, grouped into sections (generated — see Blog below) |
| `blog/*.html` | The 16 posts themselves (generated — see Blog below) |

## Working calculators

All three run entirely client-side (`assets/js/main.js`) and were verified against hand calculations:

| Tool | Method | Spot check |
| --- | --- | --- |
| Trace impedance | IPC-2141A microstrip and symmetric stripline, plus propagation delay | 8 mil trace, 4 mil height, 1.4 mil copper, εr 4.3 → 40.8 Ω, 140 ps/in |
| Plane resonance | Rectangular parallel-plate cavity modes + plate capacitance | 80 × 50 mm, εr 4.3 → f₁₀ 904 MHz, f₀₁ 1.45 GHz, 1.52 nF |
| FCC limit converter | Part 15 Subpart B quasi-peak limits, 20 dB/decade distance extrapolation | 240 MHz Class B at 3 m → 46.0 dBµV/m; measured 52.1 → −6.1 dB, FAIL |

Both the impedance and FCC tools warn when inputs fall outside where the method is valid
(w/h outside 0.1–3.0; measurement inside the λ/2π near-field boundary).

## Blog

`blog.html` and every `blog/N_*.html` file are **generated**, not hand-written. Source is the
numbered markdown files in `blog/*.md`; `blog/build_blog.py` renders them into the site's design
system and writes the HTML.

```bash
pip install markdown latex2mathml
python blog/build_blog.py
```

Re-run it whenever a `blog/*.md` file changes — the generator overwrites the corresponding
`.html` file(s) and `blog.html`. The two pip packages are a **generation-time** dependency only;
nothing is fetched or run in the visitor's browser, so this doesn't compromise the "no build
step, no dependencies" claim for the deployed site — there is no build step *to view it*, only to
regenerate it after an edit.

**Two series**, defined in `build_blog.py`'s `SERIES` list, each with its own numbering
("Reference NN of N") and prev/next pager — post 6 of one series never hands off to post 1 of the
other:

- **RF PCB Design** (`1_rf_fundamentals.md` … `6_rf_filter.md`) — the original reference series.
- **CEM Tooling & Industry Notes** (`7_open_source_fea_software.md` … `16_em_simulation_product_lifecycle.md`)
  — open-source EM/FEA/meshing/visualization tooling and market commentary, cleaned up from raw
  `.txt` drafts that used to live in `blog/`. Two of those drafts were **not** converted and were
  left in place rather than published or deleted — see "Content not published" below.

What the generator assumes about the source markdown (see its docstring for specifics):
- Title is either a `# H1` or a single bold line (`**Title**`) as the very first line — both
  styles appear across the corpus.
- Math is `$$...$$`, `\[...\]`, or `\(...\)` — no bare `$...$`. It's converted to **MathML**
  (via `latex2mathml`) and rendered natively by the browser: no client-side JS, no KaTeX/MathJax,
  no CDN. MathML Core has broad support in current Chrome/Edge/Firefox/Safari; there's no fallback
  for older engines.
- The first paragraph after the title is lifted out as the excerpt/lede; everything after that is
  the body, run through `python-markdown` (`tables`, `toc`, `sane_lists`, `fenced_code` extensions).
- Reading time is word count ÷ 220 wpm. No publish dates are shown — none of the source files carry
  real authored dates, and inventing one would be a fabricated timestamp; series position and
  reading time stand in instead.

### Content not published

`blog/Launching.txt` and `blog/The Power of EM Simulation in Product Design.txt` are still sitting
in the folder, untouched, deliberately not converted:

- **`Launching.txt`** is a personal founder-origin story for a different, real company
  ("EpsilonForge") — PhD, postdoc, University of Buenos Aires, CONICET. Publishing it under
  Machshev Labs would misattribute a real person's biography to a fictional founder this site
  already leaves unnamed on purpose (see the `about.html` TODO). Several of the *converted* posts
  (12, 13, 14, 15) came from the same EpsilonForge-branded source material — those were rewritten
  to drop the company name, the personal voice, and the service claims that don't match what
  Machshev Labs actually offers (e.g. general CAE integration consulting, cloud/HPC deployment),
  keeping only the genuinely reusable technical content.
- **`The Power of EM Simulation in Product Design.txt`** is a scraped EMWorks Inc. marketing page
  — their nav chrome, a lead-gen form, a named real author's byline, their copyright footer. It's
  third-party copyrighted material with someone else's name on it, not raw material to clean up.

Neither file should be published as-is. If you want the topics covered, they'd need to be written
fresh rather than edited from these sources — happy to do that on request.
- On-page "On this page" TOC is built from whichever heading level is shallowest in that doc (some
  posts use `##`, others only `###`).

## Assets

- `assets/css/styles.css` — design tokens including Pass/Risk/Fail verdict colours, all components
- `assets/js/main.js` — nav, scroll reveal, emissions-scan canvas, calculators, form validation,
  active-section highlighting for the blog post TOC

## Run it

```bash
python -m http.server 8123
```

Then open <http://localhost:8123>. `.claude/launch.json` starts the same server from the
editor's preview. Opening `index.html` directly off the filesystem also works.

## Content status — read before publishing

Content is drawn from the design document, but some of it is **placeholder or provisional**:

- **The contact form has no backend.** It validates and confirms locally only. Point the submit
  handler in `assets/js/main.js` at your form endpoint or inbox.
- **`hello@machshevlabs.example` is a placeholder.** Replace with the real address.
- **Founder section on `about.html` has no name or photo** — there is a `TODO` comment marking
  the spot. It reads as deliberate ("one engineer, on purpose") but is incomplete.
- **Pricing is published as the design doc's draft ranges** ($2,500–5,000 sprint, $1,500/mo
  retainer, $250–500 target for the roadmap scan). The doc flags these as unvalidated against
  real compute cost; `services.html#pricing` says so on the page. Validate before launch.
- **The three EMI autopsies are summaries, not published articles.** The page says they are
  queued. Either write them or remove the section.
- **No customer logos, testimonials, or case studies** — none exist yet, so none are invented.
  The homepage ribbon lists file formats and standards supported instead.
- Footer `Privacy` and `Terms` links are `#` stubs.

Internal strategy from the design document — business-model stage, fundraising path, entity
structure, and the open-questions list — is deliberately **not** on the public site.

Every page footer carries "Not an accredited test laboratory," and `services.html` and
`contact.html` state it explicitly, since Tier 3 sits close to a claim that would be wrong.

`blog/electromagnetics/` and `blog/rf/` hold reference PDFs (course-note style material on Smith
charts, transmission lines, microwave devices, etc.) that aren't wired into the site — they read as
source material for the six posts, not additional posts of their own. Left untouched; ask if you
want any of them linked or turned into a seventh/eighth post.
