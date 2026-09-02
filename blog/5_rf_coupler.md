**RF and Microwave PCB Design, Part 5: Couplers** — Ben Jordan, OnTrack Whiteboard series (Altium Academy), ~1 hour, whiteboard-style.

Framing: episode 4 covered power dividers (Wilkinson) as a way to split a signal and keep everything matched. Couplers do that too, but also recombine, and every one of them has an isolated port.

## 90° hybrid (branch-line), 1:00–16:00

Four-port structure: a box of quarter-wave microstrip segments with Z0 feed lines at each corner. Reminder that all of these shapes are drawn as top copper only, but there is always dielectric plus a continuous ground plane underneath.

Ports numbered around the ring. Injecting at port 1:
- Port 2 is λ/4 away, so 90° lag
- Port 3 is another λ/4, so 180°
- Port 4 sees two paths, λ/4 one way and 3λ/4 the other. 270° minus 90° is 180°, so the two contributions cancel. Port 4 is the isolated port, normally terminated in 50Ω to ground.

Branch impedances: the two branches set to Z0/√2 (0.707 × 50, about 35Ω), the other two left at Z0. Result is both outputs at 0.707·Vin, so 3 dB down each, one at 90° and one at 180°. He calls port 3 the "slave" output.

Port numbering depends on which direction you drive it, and the device is reciprocal. Consequences he draws out:
- Signal entering port 2 appears at port 4, 3 dB down and 180° shifted, isolated from port 3. So two sources can be combined while staying isolated from each other.
- The same signal into ports 2 and 3 with 90° of relative shift fully combines at port 1 and fully cancels at port 4.

Main application: the balanced amplifier. Split with a hybrid, amplify each leg separately, recombine with a second hybrid. Motivation is that a single device with the required gain, noise figure, and VSWR may be prohibitively expensive, while the hybrid itself is nearly lossless on good low-loss laminate (also applies inside a MMIC). These cascade into trees for larger splits, with every unused port terminated.

## Broadband multi-section hybrid, 16:00–21:00

Adding sections turns the single box into a ladder and widens bandwidth. The ratios of the quarter-wave segments set center frequency, bandwidth, and power split. He points at microwaves101.com repeatedly as the reference and calculator source.

Two-section worked case: outer legs (1+√2)·Z0, middle leg √2·Z0, side segments all Z0. Outputs are 1/√2·Vin at 180° and 270°, so still 3 dB down and still 90° apart, but over a much broader band.

## Rat race (ring hybrid), 21:00–28:00

Same idea, different topology: the split happens onto a ring instead of at right angles. Distances around the ring: port 1 to port 4 is λ/4, port 4 to port 3 another λ/4, and port 1 to port 2 is 3λ/4. 

- Port 2: 3λ/4 lag, so 270°
- Port 4: λ/4 lag, so 90°
- Port 3: one path totals a full wavelength, the other a half wavelength, 180° apart, cancels. Isolated, terminated.

Ring sections can carry different impedances; the power split follows the same impedance-ratio logic as the Wilkinson, with the input kept matched for 1:1 VSWR. He skips the math and points to the microwaves101 calculator that takes a desired port 2 / port 4 power ratio and returns the Z0a, Z0b values around the ring.

Primary use: generating a signal and its complement from a single-ended input with no reflection back to the source. Simplest case is a balun driving a twin-wire line to an antenna, plus various active circuits he declares out of scope.

## Coupled-line (backward) directional coupler, 28:00–end

Background first: two traces over a plane, with *s* the gap, *w* the width, *t* the substrate thickness, and copper thickness of 35 µm for 1 oz. Tighter spacing raises both the mutual capacitance and the mutual inductance, so odd-mode impedance drops. Thinner dielectric lowers the even-mode (common-mode) impedance. In digital design this coupling is crosstalk and unwanted; in microwave it is the device.

Structure: one through trace, a second trace running closely alongside for a coupled section that is almost always λ/4 (can be longer), DC isolated and AC coupled, and fairly broadband.
- Port 1 input, port 2 through
- Port 4 is the coupled output, which he flags as the counterintuitive part, hence "backward coupler"
- Port 3 is isolated and terminated

He notes that "directional coupler" is really the superset covering everything in the episode, since they all have an isolated port and a phase-shifted output, but that most people saying the phrase mean this one. Coupled power subtracts from the through port. Dielectric losses are small next to the coupled output. This is the basis for test instruments that need to sample a high-power signal without disturbing it.

### Design procedure and two worked examples

Start from coupling in dB, convert to coefficient k = 10^(−dB/20), a 0 to 1 ratio where 1 would mean the coppers are joined (unrealizable, and if you want an even 3 dB split you use a power divider or hybrid instead). Then:

- Z_even = Z0·√((1+k)/(1−k))
- Z_odd = Z0·√((1−k)/(1+k))

He writes these backwards on the board at first and corrects himself around 44:50. From there it is just a differential impedance-control problem, one quarter wavelength long.

**Example 1, 6 dB coupler.** k ≈ 0.501187 → Z_even ≈ 86.74Ω, Z_odd ≈ 28.82Ω. Substrate FR4, 62 mil (~1.53 mm), Dk 4.2, 1 oz copper, fc = 2.4 GHz. Calculator output: w = 1.96 mm (77.1 mil), λ/4 length = 18.07 mm (711.33 mil), and s = 0.042 mm, which is 1.66 mil. His point: no fab or CNC mill does that gap consistently. A 2 mil gap is achievable on good material at high cost, but not on a 1 oz external layer, and this has to be top-layer microstrip. So 6 dB coupling is past the practical limit for this stackup. Simulated S-parameters showed the through port down around 1 to 2 dB and the coupled port at −6 dB at center as predicted.

**Example 2, 12 dB coupler.** k = 0.251189 → Z_even ≈ 64.63Ω, Z_odd ≈ 38.68Ω. Result: w = 2.784 mm (109.769 mil), s = 0.532 mm (20.95 mil), λ/4 = 17.68 mm (696.057 mil). Manufacturable, though still accuracy-sensitive. He notes the quarter-wave length shifted slightly from the first example even at the same center frequency, because the odd and even mode impedances changed, and because microstrip carries part of the wave in air and part in substrate, so there are two velocities. Field solvers show that as dispersion, covered in an earlier episode. Simulated response: through port nearly flat, coupled port at −12 dB, isolated port not perfect but 20 dB down at center, and broadband overall.

Closes by reiterating that backward couplers are the right choice for broadband test-instrument sampling, and teases episode 6.

## Two things worth flagging

At 55:00 he says −12 dB is "half the power" of −6 dB. It is half the *voltage* ratio and a quarter of the power, which is consistent with the k values he actually uses (0.501 → 0.251), so the arithmetic is right and only the narration is wrong.

His variable naming drifts. Early on *t* is substrate thickness and *h* is copper thickness; in the second cross-section he labels *t* as substrate thickness and *h* as trace height, then reads the values back in mixed units and acknowledges it himself.