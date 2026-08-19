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

## Working calculators

All three run entirely client-side (`assets/js/main.js`) and were verified against hand calculations:

| Tool | Method | Spot check |
| --- | --- | --- |
| Trace impedance | IPC-2141A microstrip and symmetric stripline, plus propagation delay | 8 mil trace, 4 mil height, 1.4 mil copper, εr 4.3 → 40.8 Ω, 140 ps/in |
| Plane resonance | Rectangular parallel-plate cavity modes + plate capacitance | 80 × 50 mm, εr 4.3 → f₁₀ 904 MHz, f₀₁ 1.45 GHz, 1.52 nF |
| FCC limit converter | Part 15 Subpart B quasi-peak limits, 20 dB/decade distance extrapolation | 240 MHz Class B at 3 m → 46.0 dBµV/m; measured 52.1 → −6.1 dB, FAIL |

Both the impedance and FCC tools warn when inputs fall outside where the method is valid
(w/h outside 0.1–3.0; measurement inside the λ/2π near-field boundary).

## Assets

- `assets/css/styles.css` — design tokens including Pass/Risk/Fail verdict colours, all components
- `assets/js/main.js` — nav, scroll reveal, emissions-scan canvas, calculators, form validation

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
