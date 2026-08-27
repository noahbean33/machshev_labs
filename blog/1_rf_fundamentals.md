# RF PCB Design, Part 1: Wavelength, Materials, and the Point Where Copper Stops Being a Wire

A working reference for engineers who already know how to lay out a board and now have to make one that works above a few hundred megahertz. Formulas are given in the form you can put in a spreadsheet, with the constants pre-collapsed where that helps.

---

## 1. What counts as RF

The regulatory definition is worth getting right, because engineers quote it wrong constantly. 47 CFR §15.3(u) defines radio frequency energy as electromagnetic energy anywhere in the radio spectrum between **9 kHz and 3,000,000 MHz** (3 THz). Part 18, covering ISM equipment, uses the same span in §18.107(a). There is no 300 kHz floor in either.

Several other numbers float around and get conflated with the definition. They are all real, they just answer different questions:

| Number | What it actually is | Citation |
|---|---|---|
| 9 kHz | Lower bound of the RF spectrum, and the floor below which emissions investigation is not required | §15.3(u), §15.31 |
| 9,000 pulses/sec | Clock rate above which a product is a "digital device" and falls under Subpart B | §15.3(k) |
| 150 kHz | Bottom of the conducted emissions measurement band on AC mains | §15.207 |
| 100 kHz | Bottom of the SAR-based RF exposure evaluation range | §1.1310(a) |
| 300 kHz | Bottom of the MPE table and the MPE-based exposure evaluation range | §1.1310(d)(2), (e)(1) |
| 30 MHz | Crossover from conducted to radiated emissions testing | §15.109 |

The 300 kHz figure is the most commonly misremembered as a definition of RF. It is the bottom row of the maximum permissible exposure table, so it governs how close a human can stand to your transmitter, not whether your product is an RF device.

Useful as all of that is for compliance planning, none of it tells you anything about layout.

The definition that matters on a board is functional. A net is RF if it intentionally carries or amplifies an analog signal on its way to or from an antenna. That covers the PA output, the LNA input, the matching networks, the filter, the balun, the antenna feed, and the local oscillator distribution. In practice this starts in the megahertz and never really stops.

Microwave conventionally begins around 1 to 1.5 GHz. The boundary has no physical meaning, but it correlates with a real transition: below it you can usually get away with lumped-element matching and ordinary FR4, and above it you start needing distributed structures, controlled dielectric, and attention to copper surface finish.

The more useful classification is electrical length, covered in Section 3. Frequency alone tells you nothing until you know how long the interconnect is.

---

## 2. Wavelength and propagation velocity

### 2.1 Free space

$$\lambda_0 = \frac{c}{f}$$

Working shortcuts:

- λ₀ (cm) = 30 / f (GHz)
- λ₀ (cm) = 30000 / f (MHz)
- λ₀ (inches) = 11.8 / f (GHz)

At 2.4 GHz, λ₀ = 30/2.4 = **12.5 cm** (4.92 in).

| Band | Frequency | λ₀ |
|---|---|---|
| NFC | 13.56 MHz | 22.1 m |
| FM broadcast | 100 MHz | 3.00 m |
| ISM (sub-GHz) | 433 MHz | 69.3 cm |
| ISM (US sub-GHz) | 915 MHz | 32.8 cm |
| GPS L1 | 1.575 GHz | 19.0 cm |
| Wi-Fi / BLE | 2.4 GHz | 12.5 cm |
| Wi-Fi 5/6 | 5.8 GHz | 5.17 cm |
| X-band | 10 GHz | 3.00 cm |
| Industrial radar | 24 GHz | 1.25 cm |
| Automotive radar | 77 GHz | 3.90 mm |

### 2.2 In a dielectric

Energy travels in the dielectric, not in the copper, and the dielectric slows it down:

$$v_p = \frac{c}{\sqrt{\varepsilon_{\text{eff}}}} \qquad \lambda_g = \frac{c}{f\sqrt{\varepsilon_{\text{eff}}}} = \frac{\lambda_0}{\sqrt{\varepsilon_{\text{eff}}}}$$

The physical mechanism is polarization. As the wavefront passes, the electric field displaces bound charge inside the resin and glass. Electronic polarization (electron clouds shifting relative to nuclei) responds nearly instantly. Atomic polarization is slower. Dipolar orientation, which is the reorientation of polar groups in the epoxy backbone, is slower still and is the dominant contributor in a material like FR4. Each of those mechanisms stores energy and returns it late, and that lag is what shows up macroscopically as permittivity.

Two consequences fall directly out of this. First, the same phenomenon is what gives you capacitance and displacement current, so nothing here is exotic to RF. It governs your DDR bus too, you just did not have to think about it. Second, because the polarization mechanisms cannot keep up indefinitely, Dk falls with frequency and the loss tangent rises. FR4 quoted at 4.4 near 1 MHz is closer to 4.2 at 1 GHz and lower again at 10 GHz. Any Dk number without a test frequency attached is worthless for RF work.

### 2.3 Effective permittivity depends on the stackup

This is where the simple formula gets people. In stripline, the field is entirely inside the laminate, so ε_eff = ε_r. In microstrip, part of the field returns through air above the trace, so ε_eff is lower than the bulk Dk. Hammerstad's approximation:

$$\varepsilon_{\text{eff}} = \frac{\varepsilon_r + 1}{2} + \frac{\varepsilon_r - 1}{2}\left(1 + \frac{12h}{W}\right)^{-1/2}$$

where *h* is dielectric thickness and *W* is trace width. For FR4 (ε_r = 4.2) with a typical 50 Ω geometry, this lands around **3.0 to 3.3**.

Worked comparison at 2.4 GHz on FR4:

| Structure | ε_eff | λ_g | λ_g/20 |
|---|---|---|---|
| Free space | 1.0 | 12.5 cm | 6.25 mm |
| Microstrip, FR4 | ~3.2 | 6.99 cm | 3.5 mm |
| Stripline, FR4 | 4.2 | 6.10 cm | 3.05 mm |

If you use bulk ε_r for a microstrip, you will calculate a guide wavelength about 13% too short, and every quarter-wave stub, coupled-line filter, and branchline coupler you draw will be mistuned by that amount. Use ε_eff, and confirm it against your fab's stackup, not against a textbook value.

### 2.4 Propagation delay

Useful in the same breath, since the same physics sets it:

- Microstrip: t_pd (ps/in) = 85 × √(0.475 ε_r + 0.67) → about **140 ps/in** on FR4
- Stripline: t_pd (ps/in) = 85 × √ε_r → about **174 ps/in** on FR4

---

## 3. When a trace becomes a transmission line

The threshold is electrical length, not frequency.

**Rule: treat an interconnect as a transmission line once its physical length reaches λ_g/20.** Some references use λ_g/10 for a looser criterion and λ_g/20 as the conservative one. Use λ_g/20 for anything in a matching network or filter, where a few degrees of phase error moves your impedance measurably. Below that threshold, lumped-element treatment is defensible.

Length in degrees of phase, which is the number you actually want when tuning:

$$\theta = 360° \times \frac{\ell}{\lambda_g}$$

λ_g/20 is 18° of phase. On a Smith chart that is a visible rotation, so the threshold is not arbitrary conservatism.

Critical lengths on FR4 microstrip (ε_eff = 3.2):

| Frequency | λ_g | λ_g/20 | λ_g/4 |
|---|---|---|---|
| 433 MHz | 38.7 cm | 19.4 mm | 96.8 mm |
| 915 MHz | 18.3 cm | 9.2 mm | 45.8 mm |
| 2.4 GHz | 6.99 cm | 3.5 mm | 17.5 mm |
| 5.8 GHz | 2.89 cm | 1.45 mm | 7.2 mm |
| 10 GHz | 1.68 cm | 0.84 mm | 4.2 mm |
| 24 GHz | 6.99 mm | 0.35 mm | 1.75 mm |

At 2.4 GHz the number to internalize is **3.5 mm**. That is shorter than the pad-to-pad spacing of two 0402s with a via between them. Once you see that, the reason RF layouts look the way they do stops being stylistic.

### 3.1 The digital equivalent

The same criterion in the time domain, for anyone crossing over from signal integrity:

$$\ell_{\text{crit}} = \frac{t_r \times v_p}{6}$$

with t_r the 10-90% or 20-80% edge rate. A 200 ps edge on FR4 microstrip gives roughly 200/(6 × 140 ps/in) ≈ 0.24 in of critical length. It is the same rule wearing different clothes, because a fast edge contains energy out to f_knee ≈ 0.35/t_r.

### 3.2 When a component stops being a component

The dual problem, and the one that bites people who did the trace math correctly. Every capacitor has series inductance, and above its self-resonant frequency it is an inductor:

$$f_{SRF} = \frac{1}{2\pi\sqrt{L_s C}}$$

A 100 nF 0402 with roughly 0.6 nH of ESL self-resonates near 20 MHz. It is not a bypass capacitor at 2.4 GHz in any meaningful sense, it is a lossy inductor that happens to block DC. For RF decoupling and matching, use the smallest package your assembly process tolerates (0201 or 01005 above 5 GHz), and buy parts characterized with S-parameters. Murata, Coilcraft, and Johanson all publish S2P files. Load them into your simulator instead of trusting the nominal value.

Mounting parasitics are part of the component. A via to a ground plane adds roughly:

$$L_{\text{via}} \approx 5.08\,h\left[\ln\frac{4h}{d} + 1\right] \text{ nH}$$

with *h* and *d* in inches. A 62 mil via with a 10 mil drill is about 1.3 nH, which at 2.4 GHz is 20 Ω of reactance.

Read that number as an upper bound rather than a fixed property. The expression gives the partial self-inductance of one isolated cylindrical conductor, and inductance is a property of a loop, not of a segment. Place a ground via close to the signal via and the two carry opposing currents, mutual inductance subtracts, and the loop inductance of the pair drops well below the sum of the partial terms. Bring them closer and it drops further. This is the same field-based reasoning as Section 6, arriving from a different direction: what matters is the area enclosed between the outbound path and the return path.

That is the actual justification for the layout rule. Shunt elements in RF matching networks get two or more ground vias placed hard against the pad, not because you need more copper cross-section, but because you are shrinking the return loop.

---

## 4. Conductor loss and copper roughness

### 4.1 Skin depth

$$\delta = \sqrt{\frac{\rho}{\pi f \mu}}$$

For copper at room temperature this collapses to:

$$\delta\,(\mu m) \approx \frac{2.09}{\sqrt{f\,(\text{GHz})}}$$

| Frequency | δ (copper) |
|---|---|
| 1 MHz | 66 µm |
| 10 MHz | 20.9 µm |
| 100 MHz | 6.6 µm |
| 1 GHz | 2.09 µm |
| 2.4 GHz | 1.35 µm |
| 10 GHz | 0.66 µm |
| 24 GHz | 0.43 µm |
| 77 GHz | 0.24 µm |

For reference, 1 oz copper is 35 µm thick. At 1 GHz the current occupies about 6% of it, and the rest of the copper is dead weight. This is also why plating thickness stops mattering for RF loss above a few hundred megahertz, while surface condition starts mattering a great deal.

Surface resistance follows:

$$R_s = \frac{\rho}{\delta} = \sqrt{\pi f \mu \rho} \quad [\Omega/\square]$$

and conductor attenuation for a wide microstrip approximates as:

$$\alpha_c \approx \frac{R_s}{Z_0 W} \quad [\text{Np/m}], \qquad \alpha_c[\text{dB/m}] = 8.686\,\alpha_c[\text{Np/m}]$$

### 4.2 Why the foil is rough

Electrodeposited copper is grown on a rotating drum. The drum side comes out smooth and the growth side comes out with a dendritic "tooth," which is then usually enhanced further with an oxide or micro-etch treatment. The roughness exists to give the prepreg something to key into during lamination, and it is the reason your traces do not peel off during rework. It is a mechanical requirement, and it directly opposes an electrical one.

Once the skin depth becomes comparable to the peak-to-valley roughness, the current is forced to follow the surface contour instead of a straight path. Path length goes up, effective resistance goes up, and loss goes up. The Hammerstad correction captures the first-order behavior:

$$K_{SR} = 1 + \frac{2}{\pi}\arctan\left[1.4\left(\frac{\Delta}{\delta}\right)^2\right]$$

where Δ is RMS roughness. It saturates at 2.0, meaning Hammerstad predicts a hard ceiling of double the smooth-copper conductor loss. Measured data above 10 GHz exceeds that ceiling, which is why the Huray "snowball" model, which treats the treatment as a distribution of spheres on a flat base and computes the added surface area explicitly, has become the standard for mmWave stackup simulation. If your fab or laminate vendor gives you Huray parameters, use them.

### 4.3 Foil selection

| Foil type | Typical Rz (tooth side) | Practical ceiling |
|---|---|---|
| Standard ED (STD) | 5–10 µm | Below ~2 GHz |
| Reverse-treat (RTF) | 4–6 µm | ~5 GHz |
| VLP (very low profile) | 2–3 µm | ~10–15 GHz |
| HVLP / ULP | 1–1.5 µm | ~25–40 GHz |
| Rolled annealed (RA) | < 0.5 µm | mmWave, flex |

The heuristic: **roughness starts costing you when Rz exceeds the skin depth.** Compare the two tables above. At 2.4 GHz, δ is 1.35 µm and standard ED foil is 5 to 10 µm, so you are already deep into the penalty. You accept it below a few gigahertz because the dielectric loss dominates anyway and the cost delta is not worth it. Above roughly 10 GHz you specify low-profile foil by name and part number on the fab drawing, because "standard copper" gets you whatever the shop has in stock.

Do not specify RA copper reflexively. It has poorer peel strength on rigid laminate, costs more, and comes with panel size limits. VLP or HVLP on a proper RF laminate is the usual right answer for rigid boards.

---

## 5. Dielectric loss and material selection

$$\alpha_d\,[\text{dB/inch}] \approx 2.31 \times f\,(\text{GHz}) \times D_f \times \sqrt{\varepsilon_{\text{eff}}}$$

Dielectric loss scales linearly with frequency, while conductor loss scales with √f. The crossover means the dielectric wins eventually on any material, and on FR4 it wins early.

### 5.1 Worked loss budget

50 Ω microstrip on 8 mil FR4, W ≈ 14 mil (0.356 mm), ε_eff = 3.2, D_f = 0.020, standard ED copper.

**At 2.4 GHz:**
- α_d = 2.31 × 2.4 × 0.020 × 1.789 = 0.198 dB/in
- δ = 1.35 µm, R_s = 12.7 mΩ/sq
- α_c(smooth) = 0.0127/(50 × 0.000356) = 0.71 Np/m = 6.2 dB/m = 0.157 dB/in
- Roughness factor ≈ 1.8 → α_c = 0.28 dB/in
- **Total ≈ 0.48 dB/in.** A 4 inch antenna feed costs you about 1.9 dB.

**At 10 GHz, same geometry:**
- α_d = 0.83 dB/in
- α_c ≈ 0.32 dB/in smooth, ×2.0 roughness = 0.64 dB/in
- **Total ≈ 1.5 dB/in.**

Two things fall out of that. First, 1.9 dB in a receive path in front of an LNA is 1.9 dB straight onto your noise figure and roughly 30% of your range budget. Second, at 10 GHz the dielectric alone is worse than everything at 2.4 GHz combined, so the common framing that "above 10 GHz you need better copper" understates it. Above roughly 5 GHz you need better dielectric, and the copper decision follows from having already moved to a laminate where low-profile foil is an option.

### 5.2 Laminate reference (values at or near 10 GHz)

| Material | Dk | Df | Notes |
|---|---|---|---|
| Standard FR4 | 4.2–4.5 | 0.020–0.025 | No Dk control, no supplier guarantee |
| Isola 370HR | 4.04 | 0.021 | High-Tg FR4, better process control |
| Panasonic Megtron 6 | 3.4 | 0.004 | Low-loss, standard fab processing |
| Rogers RO4003C | 3.38 | 0.0027 | Hydrocarbon/ceramic, FR4-like processing |
| Rogers RO4350B | 3.48 | 0.0037 | Same family, UL 94V-0 rated |
| Taconic RF-35 | 3.50 | 0.0018 | Ceramic-filled PTFE/woven glass |
| Rogers RT/duroid 5880 | 2.20 | 0.0009 | PTFE, requires specialized fab |

RO4350B is the standard first step off FR4 for a reason: it laminates with normal FR4 processing and standard prepregs, so most fabs will quote it without a surcharge for special handling. PTFE materials need plasma desmear and different drilling parameters, and shops that do not run them regularly will produce inconsistent boards.

### 5.3 Hybrid stackups

You rarely need RF laminate for the whole board. A common arrangement puts one RO4350B core carrying the RF layer and its reference plane on top, with FR4 for the digital and power layers below. Cost lands close to the all-FR4 board. The constraint is that layer thicknesses and CTE mismatch have to be worked out with the fab before you commit, so get a stackup drawing signed off early rather than after layout.

### 5.4 Fiber weave

Laminate is not homogeneous. E-glass has a Dk around 6.1 and the epoxy resin around 3.2, so a trace running directly over a glass bundle sees a different effective Dk than one running over a resin-rich window. This produces impedance ripple and, on differential pairs, skew.

Mitigations, in order of preference:
1. Specify spread or mechanically-flattened glass styles (1067, 1078, 3313) rather than 106 or 7628.
2. Rotate the board 10 to 15 degrees on the panel so no trace tracks a single bundle for a long distance.
3. Route RF at a slight angle to the board edge.

Call this out explicitly on the fab drawing. It is not a default.

---

## 6. Fields first, then circuits

Circuit theory is a low-frequency approximation to Maxwell's equations, valid when the structure is small compared to a wavelength. It is a good approximation, it built most of the electronics industry, and it fails silently at RF. The failure is silent because the schematic still looks right.

The reframing that Rick Hartley, Lee Ritchie, Eric Bogatin, and Dan Beeker have pushed into the PCB community is worth adopting wholesale: **energy does not travel in the copper, it travels in the dielectric space between the conductor and its return path, as electromagnetic fields.** Copper is a waveguide boundary. It steers the field and confines it. Current in the copper is a consequence of the field arriving, not the mechanism of transport.

Adopting this changes what you look at during layout:

- The gap between a trace and its reference plane is the actual signal path, so a plane split or a missing reference layer is a break in the path even though the copper is continuous.
- Impedance is a property of the geometry of that gap, so any change in gap height, dielectric, or adjacency is a discontinuity and a reflection.
- Return current follows the path of least impedance, which above a few megahertz means directly under the trace, so anything that forces it to detour adds inductance and radiates.
- A layer transition needs the field to transition too, which is why a signal via changing reference planes needs a ground via adjacent to it. Without one, the return current has to find its way through the nearest decoupling capacitor or plane capacitance, and the loop it takes becomes an antenna.

### 6.1 From charge oscillation to radiation

Drive a straight conductor with an oscillating source. Electrons are pushed toward one end, and the far end develops a charge surplus while the near end develops a deficit. Half a cycle later the distribution reverses. Charge piles up at the extremities where it has nowhere further to go, and current is maximum in the middle where charge is passing through. The result is a standing wave of charge along the conductor with nodes and antinodes at fixed positions set by the geometry.

Accelerating charge radiates. When the conductor length is a substantial fraction of a wavelength, the fields from different parts of the structure do not cancel in the far field, and energy leaves as a propagating wave.

The half-wave dipole is the canonical case: two collinear arms of λ/4 each, driven differentially at the center. Current is maximum at the feed and zero at the open ends. Voltage is the inverse. Practical resonant length is about **0.47 to 0.48 λ₀** rather than exactly 0.5 λ₀, because end capacitance to the surroundings makes the antenna look electrically longer than it is. Radiation resistance at resonance is 73 Ω, which is close enough to 50 Ω to feed directly with a modest match.

The reason this matters for layout rather than antenna design: **the same physics applies to structures you did not intend as antennas.** An unterminated λ/4 stub, a cable pigtail, a slot in a plane, or a poorly stitched board edge all radiate for exactly the same reason. Most EMI failures are accidental antennas that happened to be resonant near a harmonic of something on the board. When you fail radiated emissions at 780 MHz, the productive question is which structure on the board is around λ/4 at 780 MHz, which on FR4 microstrip is about 54 mm.

### 6.2 Copper geometry as circuit elements

Run the argument the other way and you get the foundation of distributed design. If structures sized as fractions of a wavelength have predictable electrical behavior, you can build components out of copper shapes:

- Shorted stub, length < λ/4: inductive
- Open stub, length < λ/4: capacitive
- Quarter-wave line: impedance inverter, Z_in = Z₀²/Z_L
- Quarter-wave open stub: short circuit at the fundamental, used as a harmonic trap on PA outputs
- Coupled lines at λ/4: directional coupler, bandpass filter section

The impedance transformation along a lossless line, which is the equation everything above derives from:

$$Z_{in} = Z_0 \frac{Z_L + jZ_0\tan(\beta \ell)}{Z_0 + jZ_L\tan(\beta \ell)}, \qquad \beta = \frac{2\pi}{\lambda_g}$$

At mid-frequencies you mix approaches. Lumped elements are smaller and broader-band, distributed elements are lossless in the sense of not depending on component Q, and repeatable to the tolerance of your etch process. Below about 3 GHz, lumped usually wins on area. Above about 6 GHz, distributed usually wins on performance because component parasitics and SRF stop cooperating.

---

## 7. Practical checklist

**Before layout**
- Get a real stackup from the fab, with Dk and Df at your operating frequency, and dielectric thicknesses that are actually available.
- Compute λ_g and λ_g/20 for your highest frequency and write both on the schematic.
- Choose foil type explicitly if above 5 GHz. Put the part number on the fab drawing.
- Decide lumped versus distributed matching before you place parts, because the two need different board area.

**During layout**
- Keep RF traces shorter than λ_g/20 wherever they are not intentionally distributed structures.
- Give every RF trace a continuous, unbroken reference plane on the adjacent layer, with no splits, no gaps, and no crossing plane boundaries.
- Reference RF to ground, never to a power plane.
- Stitch ground vias along coplanar waveguide edges at spacing under λ_g/20, tighter near discontinuities.
- Put ground vias at every RF layer transition, adjacent to the signal via.
- Two ground vias minimum on every shunt matching element.
- Keep the antenna keepout clear on all layers, including the plane layers, per the antenna vendor's drawing.

**Before release**
- Sanity-check total feed loss against your link budget, using the formulas in Section 5.
- Search the layout for any structure near λ/4 at frequencies where you have significant harmonic content.
- Confirm the fab can hold impedance tolerance, and specify it (typically ±10%, sometimes ±5% at extra cost).
- Include test coupons if impedance control matters.

---

## Coming in Part 2

Microstrip, stripline, and grounded coplanar waveguide geometry with the full synthesis equations, when to pick each, PCB antenna types (inverted-F, meander, patch) with dimensioning, feed and match design with Smith chart workflow, and via transition modeling.

---

*Part of an ongoing series on hardware design practice. Corrections and disagreements welcome.*
