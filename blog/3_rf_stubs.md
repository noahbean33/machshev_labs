# Stubs: The Copper Shapes on RF Boards That Aren't Mistakes

Every engineer who has opened up a Wi-Fi module, a GPS front end, or a power amplifier evaluation board has seen them: a short spur of copper hanging off a trace and going nowhere, a fan-shaped wedge, a rectangle terminated in a cluster of vias. They look like layout errors or leftover test points. They are neither. They are stubs, and they are one of the few genuinely distributed-element tools available to you in ordinary PCB fabrication.

This article covers what a stub does physically, why the quarter-wavelength number keeps appearing, how the frequency response actually falls out of the math, what radial stubs buy you, and then a complete worked implementation on a real 4-layer stackup, including the corrections that impedance calculators leave out and that shift your resonance by more than the tolerances you were worried about.

## The transmission line you already have

A stub is a segment of transmission line branching off the main line, terminated in an open circuit, a short circuit to ground or to a supply rail, or occasionally in a resistive or capacitive load. In practice, almost every stub you will ever draw is open or shorted.

Everything a stub does follows from how a wave propagates on that segment. The propagation constant is

```
γ = α + jβ
```

where α is the attenuation constant in nepers per meter and β is the phase constant in radians per meter. On a decent board at a few gigahertz, α matters for insertion loss but not for where the resonance lands, so ignore it for now:

```
β = ω/v = 2πf/v
```

The velocity v on a microstrip is not c. The field is split between the dielectric and the air above it, which is captured by the effective relative permittivity ε_eff:

```
v = c/√ε_eff
λg = v/f = λ0/√ε_eff
```

The guided wavelength λg is the number that sets every physical dimension in a stub design. Note that ε_eff is not ε_r. For a 50 Ω microstrip on FR408 with ε_r = 3.69, ε_eff lands near 2.68 because a meaningful fraction of the field is in air. Using ε_r instead of ε_eff will put your stub roughly 17% off in length, which at 2.4 GHz is a 400 MHz error.

## What a termination does

The reflection coefficient at a load is

```
Γ = (Z_L − Z_0)/(Z_L + Z_0)
```

Two cases dominate:

**Open circuit**, Z_L → ∞, gives Γ = +1. All incident energy comes back, in phase. Current has to be zero at the open end because there is nowhere for it to go, while voltage is unconstrained.

**Short circuit**, Z_L = 0, gives Γ = −1. All incident energy comes back, inverted. Voltage is pinned to zero at the short, while current is unconstrained.

If you have ever put a TDR on a cable and watched the trace step up at an open or dive below the baseline at a short, you have watched Γ = +1 and Γ = −1 directly. The stub does the same thing, except the reflected wave comes back and interferes with the incident wave to form a standing pattern along the branch.

## The one equation that generates all stub behavior

Looking into a lossless line of length ℓ and characteristic impedance Z_s terminated in Z_L:

```
Z_in = Z_s · (Z_L + jZ_s·tan βℓ) / (Z_s + jZ_L·tan βℓ)
```

Take the two limits:

```
Open  (Z_L = ∞):  Z_in = −j Z_s cot βℓ
Short (Z_L = 0):  Z_in = +j Z_s tan βℓ
```

Both are purely reactive. A lossless stub cannot dissipate power, it can only present a reactance that varies with frequency, and that reactance sweeps the entire imaginary axis from −j∞ to +j∞ as βℓ goes from 0 to π.

Setting ℓ = λg/4 makes βℓ = π/2, where tan → ∞ and cot → 0:

```
Open  quarter-wave stub → Z_in = 0    (a short)
Short quarter-wave stub → Z_in = ∞    (an open)
```

The quarter-wave line is an impedance inverter. The general form, Z_in = Z_s²/Z_L, is the same relationship that makes quarter-wave transformers work for matching, and it is worth carrying around as a single idea rather than two separate tricks.

## The standing wave picture

The algebra is compact but the physical picture is what keeps you from making layout mistakes.

On an **open-circuited** stub, current must be zero at the open end and voltage is free to be whatever the standing wave requires. Walk back a quarter wavelength from that end. The forward and reflected waves have accumulated 180° of round-trip phase, so the voltage terms cancel and the current terms add. Voltage goes to zero, current goes to a maximum, and the junction sees a dead short. It only looks like a short at the frequency where that quarter-wave condition holds, and at the odd multiples 3f₀, 5f₀, 7f₀ where the electrical length is again an odd multiple of 90°.

On a **short-circuited** stub, voltage is pinned to zero at the shorted end. A quarter wavelength back, the round-trip phase produces a voltage maximum and a current null, so the junction sees an open circuit. At DC and at even multiples of f₀ the same stub is a hard short to ground, which is exactly the property that makes it useful as a bias injection point.

Below a quarter wavelength, the two behave as ordinary reactances:

```
Short stub, ℓ < λg/4:  Z_in = +jZ_s tan βℓ   → inductive
Open  stub, ℓ < λg/4:  Z_in = −jZ_s cot βℓ   → capacitive
```

Between λg/4 and λg/2 they swap. A shorted stub becomes capacitive, an open stub becomes inductive, and the reactance runs back through zero at λg/2 where the stub reproduces its own termination.

This sub-quarter-wave region is where most matching work happens. A short open stub is a very repeatable, very low-loss shunt capacitor with no part number, no tolerance stack, and no self-resonant frequency to worry about. Equating the reactances gives you the lumped equivalents near a chosen frequency:

```
C_eq = tan(βℓ) / (ω Z_s)      (open stub)
L_eq = Z_s tan(βℓ) / ω        (short stub)
```

For an open stub, remember that the copper also has real parallel-plate capacitance to the plane underneath it, which is already folded into Z_s and ε_eff if you computed them correctly, and double-counted if you try to add it separately.

## Trees on a hill

There is a useful analogy for when a feature stops being a piece of metal and starts being a circuit element. Stand back from a hill covered in trees. From far enough away the trees do not change the shape of the hill. Walk closer and they dominate what you see.

Wavelength is the distance you are standing back. A feature much smaller than λg is invisible to the wave and behaves as a lumped element or as nothing at all. Once a feature reaches a meaningful fraction of λg, phase varies appreciably across it and it behaves as a distributed structure with its own resonances.

The working threshold most RF engineers use is λg/20 for the lumped approximation and λg/10 for anything you are willing to ignore. On the FR408 stackup below, λg at 2.4 GHz is 76.25 mm, so λg/20 is 3.8 mm. Any unterminated spur longer than that, including an unused pad, a via stub, a test point, or a length of trace to a depopulated component, is a stub whether you intended it or not. Most accidental notches in an otherwise clean S21 come from exactly this.

## Frequency response, with numbers

The qualitative story is well known: shunt open quarter-wave stub gives a notch, shunt shorted quarter-wave stub gives a passband. The quantitative version is more useful, because it tells you how wide the notch will be and how to control it.

For a shunt admittance Y = jB bridging an otherwise matched Z₀ line:

```
S21 = 2 / (2 + jB Z₀)
```

Let the stub be exactly λg/4 at f₀ and write f = f₀(1 + δ). Near resonance the open stub's susceptance is

```
B ≈ −2 / (π δ Z_s)
```

Set the rejection level A in dB, so |S21| = 10^(−A/20). Solving for the fractional offset gives the half-bandwidth, and the full fractional bandwidth at rejection depth A is

```
BW_A ≈ (2/π) · (Z₀/Z_s) · 10^(−A/20)
```

For a stub drawn at the same impedance as the main line, Z_s = Z₀ = 50 Ω:

| Rejection depth | Fractional bandwidth | Bandwidth at 2.4 GHz |
|---|---|---|
| 10 dB | 20.1% | 483 MHz |
| 20 dB | 6.4% | 153 MHz |
| 30 dB | 2.0% | 48 MHz |
| 40 dB | 0.64% | 15 MHz |

Three things fall out of this that are hard to see from a plot alone.

First, the "narrow, a few percent" figure people quote for stub notches is a deep-rejection bandwidth, not a 3 dB bandwidth. A single open stub is a broad, shallow bowl with a very sharp null at the bottom. If your requirement is 30 dB of harmonic suppression, you have about 2% of usable bandwidth and the resonance had better land where you designed it.

Second, bandwidth scales with Z₀/Z_s. A lower-impedance, physically wider stub gives a wider notch. A high-impedance, thin stub gives a sharper, narrower one. This single relationship is the whole motivation for radial stubs.

Third, the notch repeats at 3f₀, 5f₀ and so on, but not identically. At higher orders the stub is electrically longer, conductor and dielectric loss have grown, and the junction discontinuity is a larger fraction of a wavelength, so the nulls get shallower and drift from exact odd multiples. Do not count on the third harmonic notch without simulating or measuring it.

The shorted shunt stub is the dual. Its susceptance near resonance is B ≈ (π δ / 2)/Z_s, which vanishes at f₀, so the stub disappears and the line transmits. At DC and at 2f₀ it is a hard short and transmission collapses. Calling a single shorted stub a bandpass filter is generous, since with Z_s = Z₀ the response is extremely broad, but the two facts that matter in practice are exact: it is a DC short and an RF open. That combination is why a quarter-wave shorted stub, or a quarter-wave line into a bypass capacitor, is the standard way to feed drain or collector bias into an RF path without loading it.

## Cascading stubs into a real filter

One stub gives you one resonance and very little control over shape. Connecting several shorted stubs in shunt, separated by quarter-wave series sections of line, gives a synthesizable bandpass filter. A common arrangement uses four series sections and three shorted stubs, with each section drawn at a different impedance, which is why these filters look like a row of copper paddles of varying width.

The mechanism is straightforward once you see it. Each shorted stub is a resonator. Each quarter-wave connecting line acts as an impedance inverter that turns the adjacent shunt resonator into the series resonator the ladder prototype requires. You end up with the alternating series and shunt resonance structure of a lumped bandpass filter, built entirely out of copper geometry.

Design practice for this topology:

- Start from a lowpass prototype (Chebyshev with a specified ripple, or Butterworth if you want flatness more than skirt steepness) and map through the standard stub bandpass transformation found in Matthaei, Young and Jones, or in Pozar's filter chapter.
- Passband ripple is a design input. Accepting 0.1 to 0.5 dB of ripple buys you noticeably steeper skirts than a maximally flat response.
- Realizability sets your bandwidth range, not your requirements document. Narrow fractional bandwidths drive the stub impedances toward single-digit ohms and the connecting lines toward impedances you cannot etch. This topology is comfortable roughly between 30% and 80% fractional bandwidth. Below that, use coupled-line or hairpin resonators instead.
- Check the widest and narrowest computed impedances against your fab's minimum trace and space before committing to a topology. A 12 Ω section on the stackup below is about 2.5 mm wide, which starts to interact with its neighbors and with the board edge.
- The response repeats. A stub filter centered at f₀ has spurious passbands near 3f₀ and beyond. If the thing you are trying to reject is a third harmonic, this topology will pass it happily.

## Radial stubs

When you need a broadband short rather than a sharp notch, the bandwidth relationship above tells you to lower Z_s. Widening a rectangular stub does lower its impedance, but it also creates a large piece of copper with dimensions comparable to a wavelength, which is the definition of an antenna. It will radiate, it will couple to everything nearby, and it will develop transverse resonances of its own.

The radial stub solves this by tapering. It fans out from the feed point as a wedge, typically with a radius of a quarter wavelength or less and a flare angle somewhere between 30° and 90°. The impedance drops continuously along the radius instead of stepping, the current density stays concentrated near the feed point where the taper is narrow, and the structure presents a low impedance over a much wider band than a rectangular stub of comparable area. Because the geometry is smoothly tapered rather than abruptly wide, the radiation problem largely goes away.

Two properties make radial stubs the default choice for bias networks. The short they present at the junction is broadband, so a bias tee built from a high-impedance quarter-wave line feeding a radial stub works across a wide band rather than at one frequency. And the position of the effective RF short is well defined at the vertex, which means the quarter-wave line that connects it to the signal path has a predictable electrical reference plane.

There is no simple closed-form design formula. The rigorous treatment uses radial transmission line theory with Bessel and Hankel functions (Vinding, Atwater and others have published approximations), but the practical workflow is to pick starting dimensions by intuition and then converge with a 2.5D or 3D EM solver. Numerical models typically segment the fan into a chain of small transmission-line sections of gradually increasing width and solve the cascade.

Reasonable starting points:

- Radius: 0.20 to 0.25 λg at the center frequency, then tune.
- Flare angle: 60° to 80° for a good bandwidth-to-area compromise. Wider angles give more bandwidth and more board area.
- Feed line width should be small relative to the arc length at the vertex, or the taper does its job over too short a distance.
- Use a butterfly stub, which is two radial stubs mirrored about the feed line, when you want more bandwidth and want to cancel the asymmetric current distribution a single fan produces.

If you mill a test coupon with a conventional quarter-wave stub on one channel and a radial stub on the other and sweep both on a VNA, the difference is immediate. Both null at the design frequency; the radial version holds useful rejection across several times the bandwidth.

## Worked example: 2.4 GHz on an OSH Park 4-layer stackup

Design target: 2.4 GHz for Wi-Fi and Bluetooth, Z₀ = 50 Ω, microstrip on the top layer referenced to the layer 2 plane.

**Use four layers, not two.** On a standard 1.6 mm two-layer board, a 50 Ω microstrip needs a trace roughly 2.9 mm wide. That is a large enough structure to radiate at 2.4 GHz, it makes every discontinuity electrically significant, and it forces enormous clearances around components with 0.5 mm pitch. Standard FR-4 also runs a dissipation factor around 0.02 against 0.01 or better for FR408. A four-layer stackup with a thin top dielectric solves the geometry problem and the loss problem at once.

**Stackup:**

| Layer | Material | Thickness | Property |
|---|---|---|---|
| Top copper | 1 oz | 35.6 µm | signal |
| Dielectric | FR408 | 170.2 µm | ε_r = 3.69 (measured at 1 GHz) |
| Layer 2 | ½ oz copper | 17.8 µm | ground plane |

**Calculated geometry:**

| Parameter | Value |
|---|---|
| Trace width for 50 Ω | 0.3483 mm |
| ε_eff | ≈ 2.68 |
| Guided wavelength λg at 2.4 GHz | 76.25 mm |
| Propagation delay | 5.46 ps/mm |
| Quarter wavelength (90°) | 19.0614 mm |

Carry the decimals. Four significant figures on a stub length is not false precision, it is the difference between hitting 2.400 GHz and hitting 2.43 GHz. The same discipline applies to antenna elements and for the same reason: resonant length and resonant frequency are inversely proportional, so a 1% length error is a 24 MHz shift at 2.4 GHz, and a 1% error here is 190 µm.

## The corrections your impedance calculator did not make

The 19.0614 mm number is the length of an ideal line of zero-thickness copper terminated in an ideal open or an ideal short, with no junction. None of those things exists on your board. Two corrections are deterministic, which means you should apply them in layout rather than discover them in the lab.

**Open-end fringing capacitance.** An open-circuited microstrip does not stop at the copper edge; the field fringes past it, which is electrically equivalent to a small extra length of line. The standard Hammerstad and Bekkadal correction is

```
ΔL/h = 0.412 · (ε_eff + 0.3)/(ε_eff − 0.258) · (w/h + 0.264)/(w/h + 0.8)
```

With ε_eff = 2.68, w/h = 2.046 and h = 170.2 µm, this gives ΔL = 70 µm. Your open stub should be drawn at 19.061 − 0.070 = **18.99 mm**. Skipping this puts you 0.37% low, about 9 MHz.

**Via inductance at a shorted stub.** A shorted stub terminated in a via is not shorted, it is terminated in the via's inductance. For a via of diameter d through height h:

```
L ≈ (µ₀/2π) · h · [ln(4h/d) + 1]
```

With h = 170.2 µm and a 0.25 mm drill, L ≈ 68 pH, giving +1.03 Ω of reactance at 2.4 GHz. Equating that to jZ_s tan(βℓ') shows the via mimics 0.25 mm of extra stub, so the copper should be drawn at 19.061 − 0.25 = **18.81 mm**. That is a 1.3% correction, roughly 31 MHz, and it is larger than every fabrication tolerance in the stackup. Use two or more vias in parallel to cut it (mutual inductance means you will not get a clean factor of two), keep the antipad tight, and place the vias so their inductance is in the stub and not in the return path of the main line.

**The T-junction.** The reference plane for the stub is not the centerline of the main trace. The junction adds shunt capacitance and shifts the effective start of the stub, which is a first-order effect once the trace is a few percent of a wavelength wide. Model it. If you are hand-tuning, expect the junction to pull the resonance down and plan to trim.

**Solder mask.** Liquid photoimageable mask over a microstrip raises ε_eff by a couple of percent for narrow traces, which moves resonance down by roughly 1 to 2% and can swamp everything else in the budget. Either open the mask over your RF structures and tell the fab you mean it, or include the mask in your EM model. Do not let it vary between prototype and production.

**Dielectric constant at your actual frequency.** The 3.69 figure is measured at 1 GHz. FR408 is reasonably stable to a few gigahertz, and treating it as constant to 3 GHz is defensible, but the real value at 2.4 GHz is typically slightly lower, which pushes resonance up. If you have a choice, get the Dk from your laminate vendor at the frequency you care about, and if you are going above 5 GHz, stop assuming and start measuring with a ring resonator coupon.

## Sensitivity budget

| Source | Magnitude | Frequency shift at 2.4 GHz |
|---|---|---|
| Open-end fringing (uncorrected) | 70 µm | 9 MHz (deterministic, low) |
| Via inductance (uncorrected) | 0.25 mm equivalent | 31 MHz (deterministic, low) |
| Solder mask over stub | 1 to 2% ε_eff | 24 to 48 MHz low |
| Dk tolerance ±0.05 on 3.69 | ±1.35% | ±12 MHz |
| Dk dispersion 1 GHz to 2.4 GHz | ~2% | ~17 MHz high |
| Etch tolerance ±12.7 µm on width | ±3.6% on w | ±7 MHz |
| Etch tolerance on stub length | ±12.7 µm | ±1.6 MHz |
| Prepreg thickness ±10% | ±17 µm | affects Z₀ by ±4 Ω |

The deterministic terms are worth more attention than the random ones. Correct for the open end and the via, decide what you are doing about solder mask, and your remaining uncertainty is a couple of percent.

Given a 30 dB notch has about 48 MHz of usable bandwidth, the practical strategy on a first spin is to draw the stub 2 to 3% long deliberately. Copper is easy to remove with a scalpel and hard to add. Trim, sweep, trim again, then update the layout to the measured length.

## Bring-up

Calibrate properly. SOLT with a coax cal kit leaves you referenced at the connector, with the launch, the connector transition and the feed line all inside your measurement. For anything with a sharp resonance, put TRL standards on the coupon (a through, a reflect, and a line that is a quarter wave at midband) and de-embed to the actual stub junction. The difference between the two approaches is routinely larger than the effect you are trying to measure.

Sweep wide enough to see the harmonic responses at 3f₀ and 5f₀ before you conclude the filter works, and check the passband for the spurious response that quarter-wave-based topologies always have.

## Where stubs earn their place

**Harmonic suppression on a PA output.** An open quarter-wave stub at the second harmonic frequency, placed a well-chosen distance from the device, presents a short at 2f₀ and a manageable reactance at f₀. Cheap, repeatable, and no components to buy.

**Bias injection.** A high-impedance quarter-wave line from the RF trace into a radial stub gives a broadband RF open at the trace and a broadband RF short at the far end, where you can bypass to ground and feed DC in. This is the standard bias tee in every amplifier reference design, and knowing why it works tells you immediately what changes when you move the operating band.

**Impedance matching.** Single-stub and double-stub tuners are the classical use. Move along the main line until the normalized admittance has unity real part, then place a stub whose susceptance cancels the imaginary part. Two stubs at a fixed spacing give you a tuner that can match a range of loads without moving the junction, at the cost of a forbidden region on the Smith chart.

**Notching a specific interferer.** A single open stub is often the least expensive way to put 30 dB of rejection on a known aggressor, whether that is a local oscillator leak, a clock harmonic, or an adjacent radio in the same enclosure.

**Accidental stubs.** The same physics applies to the branch you did not draw on purpose. Unused connector pins, depopulated footprints, long via barrels on thick boards, and test points on high-speed nets all resonate. When an S-parameter sweep shows a null nobody designed, measure the offending spur, convert to electrical length, and check whether it is a quarter wave at the null frequency. It usually is.

## Layout checklist

- Compute λg from ε_eff, never from ε_r.
- Subtract the open-end correction on open stubs and the via-inductance equivalent length on shorted stubs.
- Use multiple vias on shorted stubs, and keep them out of the main line's return path.
- Keep stubs at least three to five dielectric thicknesses away from other traces and from the board edge.
- Decide explicitly whether solder mask covers the stub, and keep that decision consistent from prototype to production.
- Verify that no low-impedance section is wide enough to support a transverse resonance in band.
- Sweep past the third harmonic before declaring the design done.
- Draw the first revision long and plan to trim.

The underlying idea is small enough to hold in your head: a stub is a piece of line whose termination reflects everything, and the round-trip phase decides what the junction sees. Everything else, including the notch depth, the bandwidth, the radial taper, and the correction terms, is a consequence of that one fact.