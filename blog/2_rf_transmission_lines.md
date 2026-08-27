# Transmission Lines Above 1 GHz: Modes, Loss Budgets, and When the Expensive Laminate Pays

Most PCB design rules for RF are handed down as a list to memorize. Keep the reference plane solid. Use four layers. Don't neck the trace. Buy Rogers if you're doing anything serious. Every one of those is a consequence of a small number of physical facts, and if you know the facts you can derive the rules yourself, including the cases where the rule is wrong for your board.

This is a working guide to those facts, with the arithmetic done rather than gestured at. The worked example throughout is a 2.4 GHz microstrip on a thin stackup, because that geometry produces a result most engineers guess incorrectly.

## 1. The organizing fact

A trace stops behaving as a lumped node when its propagation delay becomes a meaningful fraction of the signal period or edge rate. The usual thresholds are length greater than λ/10 for a sinusoid, or greater than about one sixth of the rise-time length for a digital edge. Past that point voltage and current vary along the line, and the geometry becomes a boundary-value problem for the electromagnetic field.

The fact that organizes everything downstream: the signal energy travels in the dielectric between the trace and its reference plane, as a field. Copper sets the boundary conditions on that field and guides it. The copper carries current as a consequence of that field, and the field is what carries the signal. Dan Beeker's compressed version of this is that it's all about the space, meaning the dielectric volume between conductors.

Every rule below follows from that. Where the field goes, the energy goes. Where the field is interrupted, the energy scatters.

## 2. Four structures, three propagation modes

### Stripline

A trace buried in dielectric between two reference planes. With equal spacing to both planes, the entire field lives in one homogeneous dielectric, which gives true TEM propagation: a single wavefront, a single phase velocity, a single wavelength, and impedance math that closes in a clean form. Cohn's 1954 curve fits handle this geometry to within a couple of percent.

Stripline costs you two things. Layer count, since you need planes above and below, and via transitions, since the signal has to get to the surface eventually to reach a component. It also traps heat, which matters for power amplifier output lines.

### Microstrip

Trace on the surface, dielectric below, plane below that, air above. Part of the field travels in the dielectric and part in air, and those two regions have different phase velocities. No single TEM solution exists. What propagates is quasi-TEM, with a small longitudinal field component and an effective permittivity somewhere between 1 and εr that depends on how the field divides between the two regions.

That effective permittivity is what all the design math actually uses:

```
εeff = (εr + 1)/2 + (εr - 1)/2 · [1 + 12H/W]^(-1/2)     for W/H ≥ 1
```

Add `+ 0.04(1 - W/H)²` for W/H < 1. The consequences of εeff being geometry-dependent are worth stating explicitly, because they surprise people:

- Wavelength on the line depends on trace width. Widen a trace and your quarter-wave stub is no longer a quarter wave.
- εeff drifts upward with frequency as the field pulls into the dielectric. This is microstrip dispersion, and it is the reason quasi-static solvers lose accuracy in the tens of gigahertz. Kirschning and Jansen published the standard dispersion correction.
- Microstrip radiates. Some field terminates in air rather than on the plane, so a fraction of the energy leaves the board, particularly at discontinuities.

### Embedded microstrip

Microstrip with solder mask over the trace. This is what you actually fabricate unless you tell the shop otherwise, and it is not what your calculator modeled unless you entered it.

Solder mask runs Dk around 3.3 to 4.2 with a dissipation factor near 0.02 to 0.035, which is worse than FR-4. It sits in the fringing field at the trace edges, where field density is high. A typical 0.5 to 1.5 mil mask coat pulls a 50 Ω microstrip down by roughly 2 to 4 Ω and adds loss. For microwave work and very fast digital, open the mask over RF traces and run bare copper in air. Plating that exposed copper with gold or silver is corrosion prevention rather than a conductivity improvement, since both metals conduct worse than copper. Corroded copper, on the other hand, is genuinely lossier, so the plating pays for itself over the life of the board.

### Grounded coplanar waveguide

The whiteboard series skips this one, and it deserves a place. GCPW puts ground pour on either side of the trace on the same layer, tied to the plane below with a via fence. The field then divides between the vertical gap to the plane and the horizontal gaps to the side pours.

GCPW earns its complexity in two situations. When you need a wide trace on a thick dielectric for current handling, the side gaps let you hit 50 Ω without the width running away. And at millimeter wave, it confines the field more tightly than microstrip, which reduces radiation and coupling.

The cost is that impedance now depends on two dimensions instead of one, etch tolerance affects both, and the via fence has to be tight. Space the fence vias at less than λ/10 at your highest frequency, ideally λ/20, or the fence becomes a slot array that leaks. The side gaps also concentrate current on the trace edges, which makes GCPW unusually sensitive to surface finish and edge roughness.

## 3. Where the current actually flows

Two separate concentrations matter, and confusing them causes bad decisions.

**Field concentration** is vertical. Field lines from the trace terminate on the nearest reference copper, so energy density is highest in the dielectric directly between trace and plane. Anything you put in that volume is in the signal path. A plane split under an RF trace forces the return current to detour around the gap, which raises loop inductance, produces a local impedance bump, and turns the gap into a radiating slot.

**Current concentration** is a skin effect result. At RF the current crowds into a surface layer of thickness

```
δ = √(ρ / (π f μ))
```

For copper this reduces to a number worth memorizing:

```
δ(µm) ≈ 2.06 / √f(GHz)
```

which gives 2.06 µm at 1 GHz, 1.33 µm at 2.4 GHz, 0.65 µm at 10 GHz, 0.39 µm at 28 GHz, and 0.24 µm at 77 GHz. The corresponding surface resistance is

```
Rs = ρ/δ ≈ 8.2 · √f(GHz)   mΩ per square
```

so 12.6 mΩ/sq at 2.4 GHz.

On microstrip, that current sits mostly on the bottom face of the trace and on the edges, with the mirror-image return current spread across the matching region of the plane directly below. The bottom face is exactly the surface the foil manufacturer roughened to get lamination adhesion, which makes copper roughness a first-order loss term. You are pushing your signal current through the tooth structure.

The return current distribution in the plane has a closed form, and it tells you how much plane you need to keep clear:

```
J(x) = I / (π H) · 1 / (1 + (x/H)²)
```

where x is lateral distance from the trace centerline and H is dielectric height. Integrating tells you that roughly 80% of the return current lies within ±3H of the trace and about 97% within ±20H. On a 4 mil dielectric, that means keeping the plane clean for 12 mil either side handles most of it, and 80 mil handles essentially all of it. This is the actual justification for the 3W rule and for plane-void keepouts.

## 4. Impedance, and what the solver is doing

The distributed model gives characteristic impedance as

```
Z₀ = √((R + jωL) / (G + jωC))
```

At RF, ωL dominates R and ωC dominates G by two or three orders of magnitude, so this collapses to the lossless form:

```
Z₀ ≈ √(L/C)
```

The frequency dependence disappears in that limit, which is why a 50 Ω line is 50 Ω across a wide band. Below the point where ωL exceeds R, typically in the low megahertz for PCB geometry, impedance does vary with frequency, which is the rising skirt you see on a TDR trace at long time scales.

Nobody solves the field problem by hand. Two bodies of work stand between you and that:

**Closed-form curve fits.** Cohn for stripline in 1954, Wheeler and then Hammerstad and Jensen for microstrip through the 1960s and 1980s. The standard Wheeler-Hammerstad microstrip form:

```
Z₀ = (120π / √εeff) / [W/H + 1.393 + 0.667·ln(W/H + 1.444)]     for W/H ≥ 1
```

These are accurate to a few percent for the geometry ranges they were fit over, and every free impedance calculator on the internet is running some version of them.

The trap is that most of these forms assume zero conductor thickness. On a 4 mil dielectric with 1 oz copper, T/H = 0.35, and the thickness correction is worth several ohms. Add the etch factor, since fabrication produces a trapezoidal cross-section with sidewalls sloped 1:1 to 2:1, so the top of your trace is narrower than the bottom. Neither effect is a refinement at thin-dielectric geometry, and both are why you specify the impedance target on the fab drawing and let the shop set the width.

**Two-dimensional field solvers.** What a quasi-static solver actually does is elegant enough to be worth knowing: it solves Laplace's equation for the cross-section twice, once with the real dielectrics in place to get C, and once with everything replaced by air to get C_air. Then

```
εeff = C / C_air        Z₀ = 1 / (c · √(C · C_air))
```

Two capacitance extractions and you have both numbers. This is what Altium's layer stack manager, Polar's SI9000, and the free solvers are doing under the hood. The method holds as long as propagation is quasi-TEM. Once dispersion or higher-order modes matter, you need a full-wave solver.

Two formulas bound the frequency range where a given microstrip stays well behaved:

```
Higher-order mode onset:    f_TE1 ≈ c / (4H√(εr - 1))
Transverse resonance:       f_ct  ≈ c / (√εr · (2W + 0.8H))
```

For the 4 mil FR-4 geometry below, both land above 300 GHz. Thin dielectric buys you enormous mode headroom, which is the real reason millimeter-wave boards use thin cores.

## 5. The loss budget

```
α_total = α_conductor + α_dielectric + α_radiation
```

### Conductor loss

Set by surface resistance divided by the effective conducting width, scaled by roughness. Rs rises as √f, so smooth-copper conductor loss also rises as √f.

The roughness multiplier from Hammerstad and Jensen:

```
K_SR = 1 + (2/π) · arctan[1.4 · (Δ/δ)²]
```

where Δ is RMS roughness. That function saturates at 2, meaning the model can never predict more than a doubling of conductor loss no matter how rough the foil gets. Real measurements exceed that ceiling above roughly 5 GHz, which is why Huray's snowball model, usually parameterized from Rz via the Cannonball approach, replaced it for serious work.

Foil classes in the numbers your solver wants: standard HTE around 2.0 to 2.5 µm RMS, VLP around 1.0 to 1.2 µm, HVLP around 0.3 to 0.5 µm. Compare those to the skin depths above and the design implication is direct. At 2.4 GHz, δ is 1.33 µm and standard foil roughness is larger than the entire conducting layer. Specifying VLP foil is frequently a cheaper improvement than changing laminate.

### Dielectric loss

The whiteboard formula is the TEM case, valid for stripline:

```
α_d = 27.3 · √εr · tanδ / λ₀      dB per unit length
```

With λ₀ in inches equal to 11.81/f(GHz), that reduces to a usable rule of thumb:

```
α_d ≈ 2.3 · f(GHz) · √εr · tanδ    dB/inch
```

Microstrip needs the filling-factor version, because only the portion of the field inside the dielectric experiences the loss:

```
α_d = 27.3 · (εr/√εeff) · ((εeff - 1)/(εr - 1)) · tanδ / λ₀
```

Applying the stripline form to a microstrip overestimates loss by roughly 30% on FR-4 geometry. That difference explains any mismatch between hand calculation and the numbers a solver reports.

The physics behind tanδ: it is the tangent of the angle between the real and imaginary parts of complex permittivity, and physically it measures the lag between an applied field and the reorientation of the dipoles in the resin. The energy in that lag becomes heat. Dielectric loss rises linearly with frequency because the field reverses more often per unit distance.

### Radiation loss

Microstrip leaks. Radiated power from an open-ended microstrip discontinuity scales roughly as (H/λ₀)², so on thin dielectric at low gigahertz it is negligible, and on thick dielectric at millimeter wave it becomes a real term. Bends, stubs, and connector launches radiate more than straight line does. This is one of the arguments for stripline or GCPW on dense RF boards, where the radiated energy from one structure ends up coupling into another.

## 6. The comparison, worked properly

Same microstrip both times. 2.4 GHz, 50 Ω target, H = 4 mil, T = 1.4 mil (1 oz), same roughness. Only the laminate changes.

| | FR-4 | Rogers (RO3003 family) |
|---|---|---|
| εr | 4.1 (characterized at 1 MHz) | 3.07 (characterized at 77 GHz) |
| tanδ | 0.014 | 0.0011 |
| Trace width for 50 Ω | 7.4 mil | 9.1 mil |
| λ/4 | 736 mil | 817 mil |
| Conductor loss | 0.468 dB/in | 0.392 dB/in |
| Dielectric loss | 0.110 dB/in | 0.0076 dB/in |
| **Total** | **0.578 dB/in** | **0.400 dB/in** |
| Over a 10 inch run | 5.78 dB | 4.00 dB |

Now read the table for what it actually says.

**Copper dominates both cases.** On FR-4, conductor loss is 4.3 times the dielectric loss. On Rogers it is 52 times. The premium laminate does not fix the dominant loss term, and on this stackup it barely touches it.

**Almost half the improvement is geometric.** Of the 0.178 dB/in the material change buys, 0.076 dB/in comes from conductor loss, and that reduction exists only because the lower εr forced a wider trace to hit 50 Ω. That 43% is a width effect. You could capture part of it on FR-4 by thickening the dielectric.

**The dominance flips with stackup thickness, not just frequency.** This is the part that inverts common intuition. Dielectric loss per inch depends on frequency, εeff, and tanδ, and it is nearly independent of trace width. Conductor loss per inch scales roughly inversely with width. Since Z₀ is pinned at 50 Ω, width tracks dielectric thickness. So:

- **Thin stackup, narrow trace:** conductor-loss dominated. Roughness, width, and surface finish are your levers. Laminate tanδ contributes little.
- **Thick stackup, wide trace:** dielectric-loss dominated. Laminate choice is the lever.

Run the numbers on a 20 mil FR-4 stackup at the same 2.4 GHz. The 50 Ω trace is around 37 mil wide, conductor loss falls to roughly 0.09 to 0.10 dB/in, and dielectric loss stays near 0.12 dB/in because the filling factor rises slightly with width. The two terms cross over. On the thick board, tanδ is the thing to fix. On the thin board it is not.

**The frequency crossover, for the 4 mil geometry.** α_c scales as √f and α_d as f, so setting them equal for the FR-4 case puts the crossover somewhere between 18 and 45 GHz depending on how much Df actually rises with frequency. On a 4 mil stackup, copper stays the dominant loss term well into millimeter wave. That is a strong argument for spending your budget on HVLP foil and a low-loss surface finish before you spend it on PTFE laminate.

### Second-order effects that bite

Lower εr means a wider trace at the same impedance, which lowers conductor loss and improves power handling. It also means a longer guided wavelength, so every quarter-wave feature grows. The Rogers λ/4 above is 11% longer than the FR-4 one. On a board with a branch-line coupler, two Wilkinsons, and a filter, that 11% is board area you have to find.

The same logic governs dielectric thickness. If a power amplifier output needs a fat trace to handle current, increase H rather than fighting the impedance with width alone. The thermal case makes this concrete: 5 W into 50 Ω on the FR-4 line above dissipates 5 × (1 - 10^(-0.0578)) = 0.62 W per inch of trace, in a 7.4 mil wide conductor with 1.33 µm of effective conducting depth. That is a thermal design problem in a place most people don't look for one.

## 7. The datasheet trap

The sharpest practical point in the source material, and it deserves expansion.

FR-4's εr is almost always characterized at 1 MHz. You are extrapolating three or four orders of magnitude in frequency to use it at 2.4 GHz, and permittivity is not constant over that span. Standard FR-4 typically runs around 4.6 to 4.7 at 1 MHz, 4.2 to 4.3 at 1 GHz, and near 4.0 at 10 GHz. Df moves the wrong direction over the same range, climbing from roughly 0.014 toward 0.020 to 0.025.

Two consequences. Your impedance calculation is off if you type the datasheet number in without correction, and your loss budget is optimistic. Use a causal dispersion model such as Djordjevic-Sarkar, which fits a wideband Dk and Df curve from a single measured point and preserves Kramers-Kronig causality, rather than treating either value as a constant.

Note also that "FR-4" is a flammability rating, not a material specification. Two laminates that both qualify can differ by 10% in Dk and 2x in Df. If the impedance matters, specify the laminate by manufacturer part number on the fab drawing.

RF laminates avoid all of this by characterizing at the frequency you will use. The Rogers material in the table is characterized at both 10 GHz and 77 GHz, and the values differ (3.00 and 3.07 respectively), which is itself the point: the vendor publishes the drift instead of hiding it.

### Glass weave, the effect nobody budgets for

Woven-glass laminates are not electrically homogeneous. Glass has Dk near 6, the resin between bundles near 3. A trace running directly over a glass bundle sees a different effective permittivity than a trace running over resin, and on a differential pair the two halves can land on different fibers. The resulting skew is typically 5 to 15 ps/inch on standard 1080 or 2116 weaves, which is enough to convert differential energy into common mode and blow an emissions test.

Mitigations, in ascending cost: rotate the board 10 to 15 degrees on the panel, route RF and differential traces at an angle to the weave, specify a spread or mechanically flattened glass style (1078, 3313, spread 1080), or move to a laminate with no woven glass at all. The PTFE materials used for radar work are popular partly because the absence of weave removes this variable entirely.

## 8. Stackup and process decisions

**Four layers minimum, planes on layers 2 and 3.** The reason is arithmetic. A 50 Ω microstrip on FR-4 needs W/H around 1.85. On a 62 mil two-layer board, that is a 115 mil trace, which is unroutable and radiates as an antenna at microwave frequencies. Put the plane on layer 2 with a 4 mil prepreg and you get a 7.4 mil trace. Controlled impedance on a two-layer board is possible only with coplanar structures or absurd trace widths.

**Copper is µr = 1**, so magnetic effects are ignorable in the conductor itself.

**Nickel is not.** This is the rule with the largest gap between how casually it is stated and how much it costs you. Run the numbers.

Nickel resistivity is roughly 4x copper's. Electroless nickel-phosphorus permeability depends strongly on phosphorus content: high-phosphorus deposits above about 10.5% P are effectively non-magnetic, while low-phosphorus deposits are ferromagnetic with effective µr running from tens to a few hundred at RF. Skin depth scales as 1/√(µr/ρ), so:

- Non-magnetic nickel at 2.4 GHz: δ ≈ 2.7 µm, Rs ≈ 26 mΩ/sq, about 2x copper.
- Magnetic nickel with µr = 100: δ ≈ 0.27 µm, Rs ≈ 257 mΩ/sq, about 20x copper.

A typical ENIG barrier is 3 to 5 µm thick, so in both cases the plated surface carries current entirely within the nickel. Where that matters depends on which faces carry current. On microstrip the dominant current face is the bottom, against the dielectric, which is never plated. The plating covers the top and the edges, and the edges carry real current density. On coplanar structures the gap-facing edges carry the majority of it, so the penalty is much worse. Pads, connector launches, and any place the signal transitions are entirely in the plated path.

Practical approach: immersion silver or OSP for boards where the RF path matters, and if you need ENIG for wire bonding or shelf life, apply it selectively and keep the RF traces and launches on bare or silvered copper. Specify the phosphorus content if the shop will accept it.

## 9. Discontinuities, and what they cost

Necking a trace to fit between IC pins changes Z₀. The reflection coefficient at a step is

```
Γ = (Z₂ - Z₁) / (Z₂ + Z₁)
```

For a 50 Ω line running into a 100 Ω neck, Γ = 0.333. Return loss is 20·log₁₀(1/|Γ|) = 9.5 dB, VSWR is 2.0, reflected power is |Γ|² = 11.1%, and the insertion loss through the step is 0.51 dB. That is worse than four inches of FR-4 microstrip, from a geometry change you might not have drawn deliberately.

The two limiting cases anchor intuition. An open circuit gives Γ = +1, reflecting everything in phase. A dead short gives Γ = -1, reflecting everything inverted.

### Quarter-wave transformer

A λ/4 section of line at the geometric mean impedance eliminates the reflection at the design frequency:

```
Z_transformer = √(Z₁ · Z₂) = √(50 · 100) = 70.7 Ω
```

The limitation is bandwidth. A single section gives you a null at f₀ and degrades on either side, with usable fractional bandwidth around 20 to 30% for a 20 dB return loss target at this impedance ratio. Cascading sections with binomial (maximally flat) or Chebyshev (equal ripple) weighting widens that considerably at the cost of length: three sections gets you past an octave.

### Tapers

A continuously tapered section outperforms a stepped transformer for the same length. Ranked by performance:

- **Linear taper.** Simple, works, needs to be long relative to λ to suppress reflection.
- **Exponential taper.** Impedance varies as Z(z) = Z₁·e^(kz), giving a smooth response above the cutoff set by length.
- **Klopfenstein taper.** Derived from the Dolph-Chebyshev distribution, this is provably optimal: minimum reflection for a given length and passband ripple, or minimum length for a given ripple. Visually it is almost indistinguishable from linear. microwaves101 hosts a spreadsheet that computes the profile.

The critical property of any taper: it is a high-pass structure. Below the frequency where the taper is roughly λ/4 long, it stops transforming, and the reflection climbs toward the untapered value. Length is the design variable, and λ/2 at the lowest frequency of interest is a comfortable target where λ/4 is the practical minimum.

### When λ/4 doesn't fit

Below a few gigahertz on a small board, a quarter wave is often larger than the space you have. 736 mil of taper to get between two IC pins is not happening. Options in order of preference:

1. **Void the plane locally.** Excess capacitance is the usual cause of a low-impedance discontinuity at a pad or neck. Removing plane copper under the offending feature raises the local impedance back toward target. This is the standard fix for SMD pad capacitance at connector launches, and the void should be sized by simulation.
2. **Lumped compensation.** At the neck, a short high-impedance section behaves as a series inductance, and a deliberate series inductance or shunt capacitance elsewhere can cancel it over a limited band. This is narrowband by nature.
3. **Accept the reflection and budget it.** Compute Γ, convert to dB, and put it in the link budget alongside the trace loss. A 0.5 dB step you have accounted for is a design decision. The same step discovered on the network analyzer is a respin.

### Vias

The source material skips vias and they are the most common failure point on real RF boards.

A signal via is a short transmission line with a poorly defined reference, plus a stub. The unused barrel below the layer transition is a resonant stub that shorts your signal at the frequency where it reaches λ/4. For a 62 mil board with a 50 mil stub in εr = 4.1 material, that resonance falls near 15 GHz. Back-drilling removes the stub, and blind or buried vias avoid it.

Three rules that follow from field behavior:

- **Give the return current a path.** A signal via that changes reference planes needs stitching vias connecting those planes, placed within a few via diameters. Without them the return current has to find its way around through the nearest decoupling capacitor, and the loop area becomes an antenna.
- **Size the antipad deliberately.** The barrel and the plane form a coaxial structure whose impedance depends on the antipad diameter. Too small and the via is capacitive, too large and it is inductive. Solve for it instead of accepting the library default.
- **Fence the transition.** At millimeter wave, a ground-signal-ground via arrangement with tight spacing keeps the transition coaxial and suppresses the parallel-plate modes that a bare via excites between planes.

## 10. Three corrections to the source material

Working from a whiteboard transcript, three items needed checking before publication. All three matter independent of the source.

**IPC-2252 is correct, and IPC-2141 is a different document.** Both exist, and both are relevant. IPC-2252, "Design Guide for RF/Microwave Circuit Boards," was published in July 2002, supersedes IPC-D-316, covers 100 MHz to 30 GHz, and contains a section on the electrical characteristics of stripline, asymmetric stripline, and microstrip. IPC-2141A, "Design Guide for High-Speed Controlled Impedance Circuit Boards," dates to March 2004 and covers controlled impedance from the digital signal integrity direction, including test coupons and TDR verification. For RF work, IPC-2252 is the right citation. For a controlled-impedance spec on a fab drawing, IPC-2141A is.

**The Rogers improvement is one order of magnitude, not two.** Dielectric loss goes from 0.110 to 0.0076 dB/in, a factor of 14.5. The conclusion survives, and the total loss improvement is smaller still at 1.4x, for the reasons in section 6.

**Check the roughness units before trusting any conductor loss number.** A 0.5 mil RMS roughness value is 12.7 µm, which exceeds even the tooth side of the roughest standard foil, and at 2.4 GHz it is nearly ten skin depths. Entered that way, the Hammerstad correction pins at its ceiling of 2.0. If the intended value was 0.5 µm (HVLP class), Δ/δ = 0.38 and the correction is about 1.12. The difference between those two entries is 1.8x in conductor loss, or roughly 2 dB over a 10 inch run. Solvers accept both mil and µm in that field and will happily compute either.

## 11. What to actually do

The decision procedure that falls out of all of the above:

1. **Compute your loss budget before choosing anything.** Length of the longest RF run, times estimated dB/inch, plus connector and discontinuity losses. If the number is comfortable, most of the rest of this does not matter.
2. **Choose stackup before laminate.** Dielectric thickness sets trace width, which sets conductor loss, which is usually the dominant term on thin boards. Four layers, planes on 2 and 3, thin prepreg to the signal layer.
3. **Specify foil roughness.** VLP or HVLP is a smaller cost delta than a laminate change and often a larger loss improvement on thin stackups.
4. **Then evaluate laminate.** Buy low tanδ when the dielectric term dominates, which means thick stackups, long runs, or high frequency. FR-4 remains fine at 2.4 GHz for a module-down design, a chip antenna feed, or any run of an inch or two. It becomes a problem on antenna arrays, or on a board full of mixers, couplers, and splitters where the accumulated run length hits 10 to 15 inches.
5. **Keep nickel out of the RF path.** Immersion silver or OSP, selective ENIG if you need it elsewhere.
6. **Simulate the discontinuities you can't avoid** and put the ones you can't fix into the budget as explicit line items.
7. **Order impedance coupons and read the TDR report.** The fab controls the width, and the only evidence that they hit your target is the coupon.

## Reference shelf

For the impedance and loss math: Brian Wadell, *Transmission Line Design Handbook*, which collects essentially every published closed form with its validity range. For the field theory behind it: Pozar, *Microwave Engineering*. For the signal-integrity treatment of loss, roughness, and material models: Hall and Heck, *Advanced Signal Integrity for High-Speed Digital Designs*. For discontinuities and return paths: Johnson and Graham, *High-Speed Digital Design*, and Eric Bogatin's work.

Standards: IPC-2252 for RF and microwave boards, IPC-2141A for controlled impedance specification and verification, IPC-TM-650 for the test methods behind every Dk and Df number on a datasheet.

Online: microwaves101 for the taper spreadsheets and matching-network math, and Dan Beeker's talks and writing for the field-first way of thinking that makes the rest of it derivable instead of memorized.
