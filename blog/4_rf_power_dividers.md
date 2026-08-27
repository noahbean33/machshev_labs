# Splitting Power on a PCB: T-Junctions, Wilkinsons, and the Physics That Forces the Choice

Every RF board that feeds two things from one source runs into the same wall. You have a 50 Ω source and two 50 Ω loads, and the obvious move (tie them together) fails for reasons that have nothing to do with power and everything to do with impedance. What follows is the full path from that constraint through the two structures that solve it, with the layout math, the component selection, the failure modes, and the measurement procedure.

The worked example throughout is a 2:1 in-phase divider at 2.1 GHz on 0.508 mm RO4350B (εr = 3.48, tan δ = 0.0037), microstrip, 1 oz copper. Numbers are given so you can check the arithmetic against your own stackup.

---

## 1. The junction is a matching problem before it is a power problem

Two 50 Ω lines in parallel present 25 Ω. Looking into that from a 50 Ω feed:

```
Γ = (25 - 50) / (25 + 50) = -0.333
|Γ|² = 0.111        → 11.1% of incident power reflected
RL = -20·log10(0.333) = 9.5 dB
VSWR = 2.0
```

A 9.5 dB return loss at the split point is unacceptable in almost any system. The reflected energy goes back up the feed, interacts with whatever is driving it, and produces gain ripple, amplifier load-pull, and in a transmitter, a real thermal problem at the PA.

The fix is to make each branch present 100 Ω at the junction, so the parallel combination is 50 Ω. Each branch then has to transform 100 Ω back down to the 50 Ω the load actually wants. That transformation is what the entire structure exists to perform.

## 2. The quarter-wave transformer, derived rather than quoted

The input impedance of a lossless transmission line of characteristic impedance Za, electrical length βl, terminated in ZL:

```
Zin = Za · (ZL + j·Za·tan βl) / (Za + j·ZL·tan βl)
```

At l = λ/4, βl = π/2 and tan βl → ∞. Divide numerator and denominator by tan βl and take the limit:

```
Zin = Za · (j·Za) / (j·ZL) = Za² / ZL
```

Set Zin = 100 Ω and ZL = 50 Ω:

```
Za = √(Zin · ZL) = √(100 · 50) = 70.71 Ω = Z0·√2
```

The result generalizes to Za = √(Z1·Z2) for any pair. The 3 dB divider case gives 70.71 Ω because the ratio happens to be 2.

### The 100 Ω lines have zero length

This trips up people reading the schematic. The 100 Ω arms shown in textbook drawings are node impedances, not physical segments. The quarter-wave transformer already presents 100 Ω at its input, so the junction sees 100 Ω ∥ 100 Ω = 50 Ω with the transformers connected directly to the tee. Adding physical 100 Ω line between the junction and the transformer detunes the structure, because that line is not electrically short and has its own transformation.

The finished topology is a 50 Ω feed into a tee, two λ/4 arms at 70.71 Ω, then 50 Ω output lines.

## 3. Turning impedance into copper

### Effective permittivity

Microstrip is an inhomogeneous medium (field partly in the dielectric, partly in air), so phase velocity depends on line width. For W/h ≥ 1:

```
εeff = (εr + 1)/2 + (εr - 1)/2 · (1 + 12h/W)^(-1/2)
```

### Synthesis from impedance

Hammerstad's closed-form synthesis, accurate to about 1% and good enough for a starting geometry that you will then tune in EM:

For W/h < 2:
```
A = (Z0/60)·√((εr+1)/2) + ((εr-1)/(εr+1))·(0.23 + 0.11/εr)
W/h = 8·e^A / (e^(2A) - 2)
```

For W/h > 2:
```
B = 377π / (2·Z0·√εr)
W/h = (2/π)·[B - 1 - ln(2B - 1) + ((εr-1)/(2εr))·(ln(B-1) + 0.39 - 0.61/εr)]
```

Running these on 0.508 mm RO4350B:

| Line | Width | W/h | εeff |
|---|---|---|---|
| 50 Ω | 1.13 mm | 2.22 | 2.73 |
| 70.71 Ω | 0.63 mm | 1.24 | 2.61 |

### Guided wavelength, computed with the right εeff

```
λg = c / (f·√εeff)
```

For the 70.71 Ω arm at 2.1 GHz:
```
λg = 3×10⁸ / (2.1×10⁹ · √2.61) = 3×10⁸ / 3.393×10⁹ = 88.4 mm
λg/4 = 22.1 mm
```

The 50 Ω line on the same board has λg = 86.5 mm because its εeff is higher. Using the 50 Ω value to lay out the 70.71 Ω arm costs you 3% in electrical length, which is 0.7 mm here and a visible shift in the response. Compute εeff per line width, always.

### Corners

Right-angle bends add shunt capacitance at the corner and radiate. The Douville and James miter, valid for W/h ≥ 0.25 and εr ≤ 25:

```
M = 52 + 65·e^(-1.35·W/h)   [percent of the diagonal removed]
```

For the 70.71 Ω arm, W/h = 1.24:
```
M = 52 + 65·e^(-1.674) = 52 + 12.2 = 64.2%
diagonal d = W·√2 = 0.891 mm
cut x = 0.642 · 0.891 = 0.572 mm
```

Curved bends with radius greater than about 3W avoid the discontinuity entirely and are the better choice when board area allows, which is convenient because the Wilkinson wants arcs anyway.

### The tee itself

A microstrip tee is not a lumped node. It has a shunt susceptance from the excess metal at the junction and reference plane offsets on all three ports. Two ways to handle it:

1. Cut a compensating wedge out of the junction. A notch of roughly 120° with a depth tuned to the line widths gives a near-reflectionless junction at center frequency. The angle is a starting point; the depth is what you sweep.
2. Use the closed-form tee discontinuity model (Garg and Bahl, or your simulator's built-in MTEE), let it tell you the reference plane shifts, and subtract those from the arm lengths.

Do both if you can. Draw the compensated geometry, then EM simulate and trim the arm lengths until S11 nulls where you want it. Expect the final arms to be a few percent shorter than the nominal 22.1 mm.

### Building it as reusable geometry

If your tool supports net ties (Altium does, as do most others under different names), draw each transmission-line segment once as a component whose copper is a net tie, with the miter and width baked in. The DRC then treats the copper as intentional rather than as a short, and you can place calibrated segments instead of redrawing polygons. Pays for itself the second time you need a divider.

---

## 4. What a T-junction physically cannot do

Simulate the compensated tee and you get clean S11 and S21/S31 near 3.01 dB. It is lossless, matched at the input, and simple. It also has zero isolation between the outputs, and that limitation is not a design flaw you can engineer away.

### The three-port theorem

A three-port network cannot be simultaneously lossless, reciprocal, and matched at all three ports. The proof falls out of the unitarity condition on the scattering matrix. If all ports are matched, the diagonal of S is zero. Reciprocity makes S symmetric. Unitarity (losslessness) then requires each pair of the remaining off-diagonal terms to satisfy conditions that force at least one of S12, S13, S23 to be zero and the other two to have unit magnitude, which describes a through path plus an isolated port rather than a divider.

So you get to keep two of the three properties:

- Keep lossless and reciprocal, give up matching at all ports: the T-junction.
- Keep matched and reciprocal, give up lossless: the Wilkinson (and the resistive divider).
- Keep lossless and matched, give up reciprocity: a circulator, which needs ferrite and bias magnets.

That is the entire design space for a three-port. Everything else is a variation on which property you sacrificed.

### What zero isolation costs you

Because the outputs are not isolated, energy arriving at port 2 travels to port 3 with only the loss of the path between them. Consequences in real systems:

- **Load mismatch cross-coupling.** A reflection from load 2 appears at load 3 and vector-sums with the wanted signal. Amplitude and phase error at both outputs varies with frequency, producing ripple you cannot calibrate out because it depends on what is plugged in.
- **Source pulling in combiner use.** Two amplifiers driving a T-junction backwards see each other. Their output impedances interact and the pair can oscillate.
- **Measurement error.** Any measurement you make on one branch is contaminated by the other branch's termination.

Two situations where none of this matters, and where the plain tee is the correct answer:

- Antenna array feeds, where both branches are nominally identical, driven in phase, and any reflection that does couple across arrives in phase and adds constructively.
- Anywhere the loads are known-good, fixed, and well matched over the band of interest.

Corporate feed networks in patch arrays use uncompensated tees by the thousands for exactly this reason. Do not add a Wilkinson to an array feed out of reflex; it costs you area, adds resistors, and buys nothing when the array is symmetric.

---

## 5. The Wilkinson divider

Bridge the two output arms with a resistor of 2·Z0 (100 Ω for a 50 Ω system, being the differential impedance between two 50 Ω ports). Everything else stays the same: two λ/4 arms at 70.71 Ω, one tee, three matched ports.

Under normal operation the resistor dissipates nothing. That claim deserves a derivation rather than an assertion, because the resistor is the entire reason the structure works and understanding when it stops being lossless is how you size it.

### Even and odd mode analysis

Normalize every impedance to Z0. The arms become √2, the bridging resistor becomes 2. Redraw the divider symmetrically about the plane that runs through the input port and the middle of the resistor, splitting the resistor into two series halves of value 1 each.

Drive ports 2 and 3 with Vg2 = 2V, Vg3 = 0, decomposed into an even excitation (V, V) and an odd excitation (V, -V).

**Even mode (V, V).** Both halves of the circuit are at the same potential everywhere. No current flows through the resistor and no current crosses the symmetry plane, so bisect the circuit with open circuits at the plane. Looking into port 2 you see a λ/4 line of normalized impedance √2 terminated in the port-1 normalized load, which appears as 2 in the bisected circuit:

```
Zin,even = (√2)² / 2 = 1     (matched)
```

The resistor is an open circuit to this mode. It cannot dissipate the wanted signal.

**Odd mode (V, -V).** The symmetry plane is a virtual ground. The resistor's midpoint is grounded, so each port sees a normalized 1 (that is, Z0 = 50 Ω) to ground through its resistor half. The λ/4 line is now shorted at its far end, and a shorted quarter-wave line presents an open circuit at its input. Port 2 therefore sees only the resistor half:

```
Zin,odd = 1                  (matched)
```

All odd-mode energy dissipates in the resistor. None of it reaches port 1 (the line is an open) and none reaches port 3 (the two halves are decoupled at the virtual ground).

Both modes are matched, so S22 = S33 = 0. The odd mode is fully absorbed and the even mode splits back through port 1, which gives S23 = S32 = 0. Carrying the excitation through port 1 gives the full ideal matrix:

```
S11 = S22 = S33 = 0
S21 = S31 = S12 = S13 = -j/√2
S23 = S32 = 0
```

### Why the half-wavelength explanation is not the real one

The common intuition (energy travels a half wavelength around the arcs, arrives 180° out of phase, and cancels) gets the right answer at center frequency and explains nothing else. It predicts perfect isolation only where the arcs are exactly λ/2 apart, and offers no account of how isolation degrades with frequency or what the resistor value should be. The even/odd picture gives you both: isolation degrades as the arms depart from λ/4 because the odd-mode short stops looking like a perfect open, and the resistor value is set by the requirement that the odd-mode input impedance equal Z0.

### Where the power actually goes when things go wrong

Sizing the resistor requires the fault cases. Using the ideal S-matrix with an incident wave a1 at the input and a reflection coefficient Γ3 on output 3:

```
b3 = -j·a1/√2
a3 = Γ3·b3 = -j·Γ3·a1/√2
b1 = S13·a3 = -Γ3·a1/2          → |Γ3|²/4 of incident power reflected to source
b2 = S21·a1 = -j·a1/√2          → port 2 still receives exactly half
P_resistor = |a1|²·|Γ3|²/4
```

Three numbers worth committing to memory:

- **Total reflection at one output** (open, short, disconnected antenna): the resistor absorbs 25% of the incident power, the source sees 25% back, and the good output still gets its full 50%. That last part is the whole value proposition. One branch failing does not disturb the other.
- **Symmetric fault** (both outputs shorted): the excitation is purely even, the resistor dissipates nothing, and all the power comes back to the source. The isolation resistor does not protect you from a common-mode fault.
- **Combiner with one source dead:** drive port 2 only. Half of that source's power exits port 1 and the other half lands in the resistor. This is the sizing case for combiners.

For a 10 W two-way combiner, one amplifier failing puts 5 W into a 100 Ω chip resistor. An 0402 thin-film part is rated somewhere around 1/16 W. Size for the fault, not for the nominal.

---

## 6. Physical realization

### Arc geometry

The two arms have to come close enough at their far ends for a resistor footprint to bridge them. Bend each arm into an arc of nearly 180°:

```
s = 2πr·(θ/360)
θ = 180° → s = πr
set s = λg/4 → r = λg/(4π)
```

For the running example:
```
r = 88.4 / (4π) = 7.03 mm
```

That is the centerline radius, and it is a starting point rather than an answer. Three corrections follow:

1. **Measure the electrical length along the centerline** of the arc, including the straight run into the tee and the straight run out to the resistor pad.
2. **Subtract the tee reference plane offset**, which typically shortens each arm by a fraction of a millimeter.
3. **Subtract the resistor pad extension.** The pad and the copper leading to it are part of the arm. Pad capacitance also pulls the effective electrical length longer than the physical length.

Ratio check: r/W = 7.03/0.63 = 11.2, comfortably above the 3W threshold where curvature discontinuity stops mattering. Curved arms need no mitering.

### Resistor selection

The isolation resistor is the component most likely to limit your measured performance.

**Parasitics.** A standard 0603 thick-film resistor has 0.4 to 0.8 nH of series inductance and 0.1 to 0.2 pF of shunt capacitance. At 2.1 GHz, 0.6 nH is +j7.9 Ω, small against 100 Ω but enough to move the isolation null and reduce its depth. At 6 GHz the same part is +j22.6 Ω and the isolation null is visibly degraded. Use thin-film RF resistors with characterized S-parameters (Vishay FC/CH series, Susumu RR, State of the Art) and put the vendor's model into your simulation rather than an ideal 100 Ω.

**Size versus coupling.** The tension is real and worth stating plainly. A smaller footprint (0402, 0201) has lower parasitics and shorter connecting copper, but it pulls the two arms closer together at their ends. Microstrip couples mostly to the ground plane beneath it, and not entirely; two 0.63 mm traces separated by less than about 3h begin to exhibit meaningful arm-to-arm coupling, which perturbs the even and odd mode impedances the design assumed were independent. Practical resolution:

- Below about 3 GHz, 0603 is fine and the coupling penalty at that spacing is negligible.
- From 3 to 10 GHz, use 0402 and either accept the coupling or model the arm ends as a coupled-line pair and re-derive the arm impedances.
- Above 10 GHz, use 0201 or an integrated thin-film resistor on the substrate, and simulate the whole structure in 3D.

**Grounding.** The resistor floats between the two arms. It needs no via, which removes via inductance from the isolation path entirely. This is a genuine advantage over the Gysel topology and one reason the Wilkinson dominates at low and medium power.

### Ground and keepout

- The reference plane under the entire structure must be continuous. A split or a plane gap under an arc converts a controlled-impedance line into a slot antenna.
- Stitch ground vias around the perimeter of the structure at intervals under λg/10 (8.8 mm here), tighter if a lid or shield is nearby.
- Keep other routing at least 3W from the arms, and 5W if you want isolation better than 30 dB. Measured output-to-output isolation is more often limited by stray coupling in the layout than by the divider circuit.
- If the board goes into a metal enclosure, check the cavity resonance frequency. A resonant lid over a divider destroys isolation at one specific frequency and generates a support ticket six months later.

---

## 7. Bandwidth, which the λ/4 dependence makes narrow

The single-section quarter-wave transformer has a closed-form fractional bandwidth for a given worst-case reflection Γm:

```
Δf/f0 = 2 - (4/π)·arccos[ (Γm/√(1-Γm²)) · (2√(Z0·ZL) / |ZL - Z0|) ]
```

The even-mode problem is a transformation from 50 Ω to 100 Ω, so Z0 = 50 and ZL = 100:

| Return loss spec | Γm | Fractional BW |
|---|---|---|
| 15 dB | 0.178 | 68% |
| 20 dB | 0.100 | 37% |
| 25 dB | 0.056 | 21% |

Those are ideal-component numbers for the match only. Once you require isolation and amplitude balance to hold simultaneously, and once the resistor parasitics are included, a single-section microstrip Wilkinson typically delivers 20 to 30% usable bandwidth. Also note the structure repeats at odd harmonics: the arms are 3λ/4 at 3f0, so a Wilkinson passes and splits the third harmonic just as happily as the fundamental. Do not rely on it for harmonic rejection.

### Multi-section Wilkinsons

Cascade N quarter-wave sections, each with its own bridging resistor. The even-mode problem becomes a standard multi-section transformer from Z0 to 2Z0, and the resistors are then chosen so the odd-mode input impedance stays near Z0 across the band.

For a two-section binomial (maximally flat) design, the section impedances follow from:

```
ln(Zn+1/Zn) = 2^(-N) · C(N,n) · ln(ZL/Z0)
```

With N = 2, Z0 = 50, ZL = 100:
```
Z1 = 50 · 2^0.25 = 59.5 Ω     (nearest the input)
Z2 = 59.5 · 2^0.5 = 84.1 Ω    (nearest the outputs)
```

The two resistor values do not follow from the even-mode analysis; they come from forcing the odd-mode ladder (each shorted λ/4 section loaded by its resistor pair) to present Z0 at the output ports across the band. Cohn's equal-ripple tables give tabulated values, and any circuit simulator will optimize them in seconds. As a sanity check on whatever you get: the resistor nearest the input comes out substantially larger than 2·Z0 and the one nearest the outputs smaller.

Costs of going multi-section: length grows by λ/4 per section, insertion loss grows with it, and the extra resistors mean extra parasitics. A two-section design buys roughly an octave. Three sections gets you past 2:1 with ripple in the low single-digit tenths of a dB.

### Lumped-element equivalent below about 1 GHz

At 500 MHz, λg/4 on FR-4 is around 75 mm and the arcs stop fitting. Replace each quarter-wave line with a pi-network that has the same ABCD matrix at f0:

```
series L = Zc / ω0
shunt C = 1 / (ω0·Zc)   [at each end]
```

For Zc = 70.71 Ω at 1 GHz:
```
L = 70.71 / (2π×10⁹) = 11.25 nH
C = 1 / (2π×10⁹ · 70.71) = 2.25 pF
```

The bandwidth is comparable to the distributed version, the size is a fraction, and the performance is entirely determined by component Q and tolerance. Use 2% or better parts with characterized self-resonance well above f0.

---

## 8. Unequal splits

Define the split by K² = P3/P2, so K > 1 means port 3 gets more power. The design equations:

```
Z03 = Z0·√((1 + K²)/K³)
Z02 = K²·Z03 = Z0·√(K·(1 + K²))
R   = Z0·(K + 1/K)
```

The output ports now present Z0·K at port 2 and Z0/K at port 3, so each needs its own quarter-wave transformer back to Z0 if you want 50 Ω connectors.

Check against the equal case, K = 1: Z02 = Z03 = 50√2 = 70.71 Ω, R = 100 Ω. Correct.

### Worked example, 3 dB imbalance (2:1 power ratio)

K² = 2, K = 1.414:
```
Z03 = 50·√(3/2.828) = 51.5 Ω
Z02 = 2 · 51.5 = 103.0 Ω
R   = 50·(1.414 + 0.707) = 106.1 Ω  → use 105 Ω or 110 Ω E96
Port 2 output match: 50·1.414 = 70.7 Ω → λ/4 at √(70.7·50) = 59.5 Ω
Port 3 output match: 50/1.414 = 35.4 Ω → λ/4 at √(35.4·50) = 42.0 Ω
```

### Where it stops being manufacturable

Push to a 10 dB tap (K² = 10, K = 3.162):
```
Z03 = 29.5 Ω
Z02 = 294.9 Ω
R   = 173.9 Ω
```

A 295 Ω microstrip on 0.508 mm RO4350B requires W/h below 0.01, which is under 5 µm of trace width. Not manufacturable in copper etch. Even a 3:1 split (Z02 = 131.6 Ω) needs about 0.14 mm of width, where a ±25 µm etch tolerance moves the impedance by roughly 8% and the split ratio visibly with it.

Practical guidance:

- Up to about 3:1 in microstrip on a normal stackup, with attention to etch tolerance on the high-impedance arm.
- Beyond that, use a directional coupler (which is what you actually want for tapping a small sample), or cascade two moderate splits, or move to a medium that supports higher impedances such as suspended stripline or thin-film on alumina.

For array amplitude tapers (Taylor, Chebyshev), the required ratios per stage are usually modest enough to stay in the manufacturable range if you distribute the taper across the tree rather than concentrating it in one divider.

---

## 9. Choosing the structure

| Structure | Loss | Isolation | Ports matched | Bandwidth | Notes |
|---|---|---|---|---|---|
| T-junction | ~0 (dielectric/conductor only) | none | input only | wide | correct choice for symmetric array feeds |
| Resistive (star) | 6 dB | 6 dB | all | DC to many GHz | when bandwidth beats efficiency |
| Wilkinson, 1 section | 3.0 dB + copper/dielectric | 20 to 30 dB | all | 20 to 30% | the default |
| Wilkinson, 2 to 3 section | slightly higher | 20 to 25 dB | all | octave to 2 octaves | longer, more resistors |
| Branch-line hybrid | 3 dB | yes | all | ~10 to 20% | 90° phase difference, 4 port |
| Rat-race | 3 dB | yes | all | ~20% | in-phase and anti-phase outputs |
| Gysel | 3 dB | yes | all | ~20% | resistors grounded, so high power heat sinking is possible |
| Lumped Wilkinson | 3 dB + component loss | 20 dB typical | all | 20 to 30% | below ~1 GHz, area-limited designs |

Two selection notes that matter more than the table:

- If you need quadrature, do not build a Wilkinson and add a line length. Use a branch-line or Lange coupler, where the 90° relationship holds across the band instead of at one frequency.
- If you are combining hundreds of watts, go to Gysel. Its isolation resistors connect to ground through quarter-wave lines, which means you can bolt them to the chassis. A floating chip resistor between two arms has nowhere to send the heat.

---

## 10. Second-order effects to check before fab

**DC behavior.** Both structures pass DC from input to both outputs, and the Wilkinson also puts a 100 Ω DC path between the two output ports. If one output feeds something that is DC-grounded (a shorted-stub-matched antenna, an inductively biased LNA input) you have created a DC path you may not have intended. Series blocking capacitors fix it; pick ones whose series resonance sits above your band, and remember that the caps have their own reflection.

**Loss budget.** Insertion loss above the ideal 3.01 dB comes from conductor loss, dielectric loss, and radiation. On RO4350B at 2.1 GHz expect 0.05 to 0.1 dB extra. On FR-4 (tan δ ≈ 0.02, and εr varying with glass weave and resin content) expect 0.2 to 0.4 dB extra at the same frequency, plus a center frequency uncertainty of a few percent from εr tolerance. FR-4 remains usable up to about 3 GHz for non-critical splits; past 6 GHz it stops being a rational choice.

**Copper roughness.** The Hammerstad-Jensen correction inflates conductor loss by a factor approaching 2 for standard-profile foil once the skin depth approaches the roughness RMS. Skin depth in copper at 2.1 GHz is 1.4 µm, comparable to standard foil roughness of 1 to 2 µm RMS. Specify VLP or HVLP foil for anything above a few GHz.

**Tolerance stack.** Etch tolerance ±25 µm on the 0.63 mm arm is ±4% in width, roughly ±2% in impedance. Dielectric thickness tolerance is typically ±10% on thin cores. εr tolerance is ±0.05 on Rogers laminates and considerably worse on FR-4. Simulate the corners, and if the design is tight, leave a tuning pad or a trimmable stub on the first build.

**Simulation.** Closed-form models get you a starting geometry. Final verification needs a field solver: 2.5D method-of-moments (Sonnet, Momentum) is sufficient for planar microstrip, and 3D FEM (HFSS, CST) is warranted when the resistor body, enclosure, or connector launch is in play. Include the resistor as a measured S-parameter block at an internal port.

---

## 11. Measuring it

A three-port measured on a two-port VNA requires terminating the unused port, and the quality of that termination sets the floor of what you can measure.

1. **Calibrate properly.** SOLT with a coaxial kit calibrates to the connector face, which leaves the launch and the feed line in your measurement. For an honest number, build a TRL kit on the same panel with the same launch and calibrate to the reference plane at the divider. The difference between the two methods is routinely 0.2 to 0.4 dB.
2. **Terminate the third port with a good load.** A 50 Ω termination with 20 dB return loss injects a reflection that corrupts your S11 measurement more than any real defect in the divider. Use a load characterized to better than 30 dB across the band.
3. **Measure isolation deliberately.** S23 with port 1 terminated is the number that matters. Measuring it with port 1 open or unterminated gives a meaningless answer, since the input port then reflects energy back into the structure.
4. **Check amplitude and phase balance**, not just S21. For array feeds, phase balance between the branches is often the specification that fails first, and it fails because of small length differences in the routing after the divider rather than in the divider itself.

Expected results for a well-built single-section 2.1 GHz microstrip Wilkinson on Rogers: S11 better than 20 dB over roughly 25% bandwidth, S21 and S31 between 3.1 and 3.2 dB, amplitude balance within 0.1 dB, isolation 20 to 25 dB with the null exceeding 30 dB at center. If isolation measures worse than 15 dB, suspect layout coupling and resistor parasitics before suspecting the arm lengths.

---

## 12. Pre-fab checklist

- [ ] εeff computed separately for each line width, and λg/4 derived from the arm's own εeff
- [ ] Arm lengths measured along the centerline, with tee reference plane offset and resistor pad extension subtracted
- [ ] Tee compensated (wedge or model-based shortening) and verified in EM
- [ ] Bends either mitered per Douville-James or curved with radius > 3W
- [ ] Resistor is thin-film RF grade with a vendor S-parameter model in the simulation
- [ ] Resistor power rating covers the one-branch-failed fault case (25% of input power for a divider, 50% of one source's power for a combiner)
- [ ] Arm-to-arm spacing at the resistor checked against 3h, coupling modeled if closer
- [ ] Continuous reference plane under the entire structure, stitched at < λg/10
- [ ] Keepout of 3W to 5W from all other routing
- [ ] Enclosure cavity resonance checked if the board is shielded
- [ ] DC path implications through the divider and the isolation resistor reviewed
- [ ] Corner simulation across etch, thickness, and εr tolerance
- [ ] TRL standards placed on the panel for honest measurement

---

## Where this goes next

The same quarter-wave machinery, arranged differently, produces the branch-line hybrid (quadrature outputs, four ports) and the rat-race (sum and difference ports). Both are directional couplers, and both follow from the same constraint that opened this piece: a junction of transmission lines splits power according to the impedances presented, and every useful structure is an arrangement of transformations that makes the presented impedances come out right.

The unequal-split algebra above is worth scripting once. Feed it a dB imbalance and a substrate stackup, and have it return arm impedances, widths, and arc radii. Microwaves101 hosts a calculator that covers the impedance half of that, and the layout half is mechanical once you have the synthesis equations in code.
