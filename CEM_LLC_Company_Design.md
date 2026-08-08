# CEM LLC — Company Design Document

*Working draft — reflects decisions made and open questions as of this stage.*

## Mission

Democratize computational electromagnetics for hardware startups by replacing $50,000+/year enterprise CEM licenses and PhD-level desktop tools with affordable, simple EMI/EMC, SI/PI, and FCC pre-compliance support.

## Core Problem We Own

Two compounding failures in the current market:

1. **HPC/CEM software is expensive and complex.** Ansys HFSS, CST Studio Suite, COMSOL, and Cadence Sigrity carry high five- to six-figure annual license costs, plus separate HPC infrastructure, and are built for aerospace/enterprise workflows — steep learning curves, heavy setup, overkill for most board-level and enclosure problems a startup actually hits.
2. **The consulting/lab alternative is just as broken.** EMC labs and boutique consultants are opaque on pricing, slow to quote, and market themselves in language non-RF founders don't understand. Most startups don't discover they need this work until they fail an FCC submission — an expensive, late fire drill instead of a planned step.

## Target Customer

Seed-to-Series-B hardware startups: consumer electronics, IoT, wearables, robotics, EV, drones, industrial, and medical devices at the **pre-compliance stage**. Typically 1–3 hardware engineers on staff, no in-house EM specialist, first FCC submission looming.

## Business Model Stage — Open Decision

Two legitimate paths, not yet chosen, and worth pinning down before the pitch narrative locks in:

- **Income-replacement consultancy** — revenue covers a fair owner salary plus expenses. Breakeven-plus-salary is a completely legitimate outcome; no outside capital required.
- **Venture-scale company** — needs real margin *above* owner salary (i.e., EBITDA) to raise on or eventually sell. This is what investors and acquirers actually value a company on — it's also exactly why LFM Capital was the wrong fit (they buy $3M+ EBITDA businesses, not breakeven ones).

This choice determines what "traction" needs to look like and who you raise from, if anyone.

## What We Sell — Tiered Model

### Tier 1: Automated Pre-Flight PCB Check (Software-led)
**Status: long-term roadmap item, not MVP.**
- Drag-and-drop upload of Gerber/ODB++/IPC-2581 + stackup files
- Automated rule-based + full-wave checks for common EMI/SI traps (return path discontinuities, unstitched ground planes, crosstalk, decoupling capacitor placement)
- Plain-English report with specific fixes ("Move decoupling capacitor C12 within 2mm of U4 pin 8")
- **Open risk:** fully automated, zero-engineer-in-the-loop verdicts on arbitrary board geometry is the hardest unsolved problem in this space — it's most of what Ansys/Cadence still haven't automated after decades. Promising this as a day-one product understates both the engineering lift and the liability if a startup ships on a false "Pass."

### Tier 2: Deep-Dive SI/PI & EMI Simulation (Service-led)
**Status: the actual MVP.**
- Dedicated simulation sprints for high-risk interfaces (PCIe Gen4/5, DDR4/5, RF front-ends, high-power switching regulators)
- Full-wave 3D extraction and channel modeling on cloud-based compute
- Deliverable: eye diagrams, PDN impedance profiles, validated stackup/layout sign-off before tape-out

### Tier 3: FCC/CE Pre-Compliance & Certification Navigation
- End-to-end guidance from bench pre-compliance testing through formal test-lab sign-off
- If a device fails at a certified lab, ingest the lab's scan data, correlate in simulation, and design a targeted mitigation (snubbers, shielding, ferrite selection, layout tweaks) without a full blind re-spin
- Works alongside an accredited FCC test lab, not as a replacement for one

## The Flywheel (moat)

Every Tier 2/3 consulting engagement generates proprietary simulation and validation data. That data sharpens Tier 1's automated templates and defaults over time — a data advantage a generic solver vendor can't replicate. Services aren't just revenue; they're the training loop for the software.

## Interface Philosophy

- Guided workflows and smart defaults over general-purpose geometry CAD
- Plain-English "Pass / Risk / Fail" style reports instead of raw field dumps or S-parameters
- Simple flow: **Upload & Parse → Select Target Standard (e.g., "FCC Class B?" "Which interfaces need SI review?") → Automated Cloud Solve → Actionable Report**
- One-click KiCad/Altium plugin integration — send a net or board area directly to CEM LLC from inside the tool engineers already have open

## Competitive Differentiation

| Dimension | Traditional CEM (Ansys/CST/Cadence) | CEM LLC |
|---|---|---|
| Pricing | $40k–100k+/yr seat license + separate HPC costs | Pay-per-board-spin, subscriptions, or fixed-scope consulting |
| Interface | Desktop-heavy, manual mesh tuning and boundary conditions | Browser-based, automated meshing, guided intent-based inputs |
| Deliverables | Raw S-parameters, field plots requiring PhD interpretation | Plain-English risk reports with specific mitigation steps |
| HPC management | User manages local servers or pays proprietary cloud tokens | Zero-config, auto-scaled cloud compute under the hood |
| Go-to-market | Enterprise sales reps, 6-month procurement cycles | Product-led growth, free tools, transparent pricing |

## Pricing (draft — needs validation against actual compute costs)

- **Pre-Flight Scan:** $250–500 per board run
- **Pre-Tapeout Simulation Sprint:** $2,500–5,000 fixed fee
- **FCC Retainer:** $1,500/month for ongoing access, stackup review, and lab troubleshooting

*Caveat: full 3D EM simulation isn't cheap to run. These numbers need to be checked against real cloud compute cost per solve before they're locked — a $250 scan has to be profitable after compute spend, not just after your time.*

## Go-to-Market

- **"EMI Autopsies"** — simulation-backed teardowns of real FCC failure case studies ("Why this IoT device failed radiated emissions at 240 MHz — and how a $0.05 capacitor fixed it")
- **Free lead-magnet calculators** — PCB via/trace impedance, power plane resonance/decoupling estimator, FCC emissions limit converter
- **ECAD ecosystem integration** — lightweight KiCad and Altium plugins
- **Accelerator/incubator partnerships** — HAX, YC hardware cohorts, local hardware spaces, as the standard EMI/FCC pre-flight check

## Roadmap: MVP vs. Vision

- **Day one:** Tier 2 + Tier 3 — expert-led, cloud-accelerated, human-reviewed. This is where trust and revenue get built first.
- **3-year vision:** Tier 1 self-serve automation matures as Tier 2/3 engagements accumulate the proprietary dataset needed to make automated verdicts reliable.

## Open Questions / Decisions Still Needed

- **Business model stage:** income-replacement consultancy vs. venture-scale company — affects fundraising path entirely
- **Software stack:** open-source EM solvers (e.g., openEMS) vs. negotiated startup-tier commercial licenses
- **Certification scope:** pre-compliance + partner with an accredited lab, or go further
- **Pricing validation:** real compute cost per solve type, at the proposed price points
- **Entity/tax structure:** default LLC vs. S-corp election — needs a CPA, not general advice
- **Fundraising path:** not a fit for PE buyout funds like LFM Capital (wrong stage/asset class); needs an early-stage SaaS/hard-tech infrastructure VC instead, if the venture-scale path is chosen

## Team

**You** — CEO. Sets technical direction, product priorities, and customer relationships.
