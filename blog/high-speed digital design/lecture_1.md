# Rise Time Sets Everything Else

### The fundamentals of high-speed digital design, worked out in numbers you can do at your desk

A 10 MHz board with 500 picosecond edges is a high-speed board. It will ring, it will couple into its neighbors, it will bounce its own ground reference, and it will fail EMC. The clock frequency printed on the schematic tells you almost nothing about any of that. The transition time does.

This is the central claim in Chapter 1 of Johnson and Graham's *High-Speed Digital Design: A Handbook of Black Magic*, and thirty years later it remains the single most useful reorientation available to a digital designer. What follows is that chapter rebuilt as a working toolkit: the physics first, the arithmetic that falls out of it, and the design decisions the arithmetic forces.

The through-line is that every rule of thumb here is a bounded estimate with a stated error bar. Johnson's argument throughout is that a rough calculation you actually perform beats an exact simulation you never run because you lack the time, the field solver license, or the material data. That argument holds up.

---

## Where the energy actually is

Start with the spectrum, because everything downstream is a consequence of it.

A digital clock is not a square wave. It is a trapezoid with period *T* and a 10-90% transition time *Tr*. Run the Fourier transform and the spectral envelope has three regions:

- Flat at low frequency.
- A break near **1/(πT)**, after which the envelope rolls off at 20 dB per decade. This break is set by the clock period.
- A second break near **1/(πTr)**, after which the rolloff steepens to 40 dB per decade. This break is set by the rise time.

Above the second break, energy falls off fast enough that the circuit's behavior up there stops mattering to the shape of the edge. The rise time, not the clock period, sets the outer boundary of the signal's meaningful spectral content. That is the mathematical content of the opening claim.

From this Johnson defines the workhorse of the entire book:

**F_knee = 0.5 / Tr**

The exact breakpoint is 1/(πTr), which is 0.318/Tr. Johnson rounds it up to 0.5/Tr to account for how energy actually distributes across a realistic 10-90% transition and to leave the estimate conservative. It is a deliberately loose number, and its looseness is the point.

What it buys you is a replacement for Fourier analysis. When you find a parasitic on the board, you evaluate its impedance at F_knee, compare that against the characteristic impedance of the circuit around it, and decide in one line whether it matters. No harmonic sum, no simulation.

| Logic family | Typical Tr | F_knee |
|---|---|---|
| Standard TTL | 5 ns | 100 MHz |
| Fast CMOS | 1 ns | 500 MHz |
| LVDS | 300 ps | 1.7 GHz |
| SerDes (PAM4) | 30 ps | 17 GHz |

The immediate corollary is that gratuitous speed is a liability. Specify a driver with a 1 ns edge for a timing budget that a 5 ns edge would satisfy, and you have moved F_knee from 100 MHz to 500 MHz. Every series inductance on the board just got five times more reactive. Every shunt capacitance just got five times more conductive. Ground bounce, reflections, and crosstalk all scale with it, and you bought none of it deliberately.

This is the first place the physics reaches into procurement. Drive strength and slew rate settings on modern parts are configurable in most cases. Set them to the slowest edge that closes timing, and record why in the design file, because the next person to touch the BOM will otherwise treat "faster part, same price" as a free upgrade.

---

## Turning nanoseconds into inches

Signals travel as electromagnetic waves at a velocity fixed by the dielectric around them:

**v = c / √ε_r,eff**

In vacuum, c is 11.8 in/ns, usually rounded to 12 for mental math. FR-4 has a bulk relative permittivity near 4.3, which gives:

- **Stripline** (conductor buried in homogeneous FR-4): v = 5.7 in/ns, delay = **176 ps/in**.
- **Microstrip** (conductor on the outer layer, fields split between FR-4 and air): effective permittivity near 3.1, so v = 6.7 in/ns, delay = **149 ps/in**.

That difference is not a rounding detail. It means outer-layer routing is meaningfully faster than inner-layer routing, which matters for matched-length groups that change layers partway. Length matching in inches is wrong across a layer transition; match in picoseconds.

Now convert the rise time into a physical length:

**l = Tr × v**

A 1 ns edge in FR-4 stripline occupies about 5.7 inches of trace. That is the distance between the point where the voltage starts to leave the logic-low level and the point where it arrives at logic-high, existing simultaneously on the same conductor. Getting this picture in your head is what makes the next section obvious rather than memorized.

| Tr | Edge length, stripline | Edge length, microstrip |
|---|---|---|
| 5 ns | 28.5 in | 33.5 in |
| 1 ns | 5.7 in | 6.7 in |
| 500 ps | 2.8 in | 3.4 in |
| 300 ps | 1.7 in | 2.0 in |

---

## The decision that governs everything else

If the interconnect is much shorter than the rising edge, every point on it sits at essentially the same potential at the same instant. Kirchhoff's laws hold, R/L/C elements with no physical extent describe the structure completely, and there is no characteristic impedance to match and no reflection to worry about. The structure is **lumped**.

If the interconnect is comparable to or longer than the edge, several distinct voltage levels coexist along the conductor at once. You need transmission line theory: phase delay, characteristic impedance, termination. The structure is **distributed**.

Johnson's threshold is that lumped analysis holds while the one-way propagation delay stays under roughly one sixth of the rise time:

**L_trace < l / 6 = (Tr × v) / 6**

The factor of six comes from tolerating something in the range of 15 to 20 percent reflection error. Change your tolerance and you change the divisor. That is an engineering judgment about acceptable error, and Johnson says so plainly rather than dressing it as physics.

| Tr | Critical length, stripline | Critical length, microstrip |
|---|---|---|
| 5 ns | 4.7 in | 5.6 in |
| 1 ns | 0.95 in | 1.1 in |
| 500 ps | 0.47 in | 0.56 in |
| 300 ps | 0.28 in | 0.34 in |

Two things fall out of that table.

First, the criterion contains rise time and does not contain clock period anywhere. Take a 6-inch trace and drive it with a 500 ps edge and you are more than twelve times past the threshold, at any clock rate whatsoever, including DC with one transition per hour. Drive the same trace with a 5 ns edge and you are at 1.05 ns of delay against a 0.83 ns limit, which is marginally over: not a disaster, but not the comfortable lumped case it is often described as either. The commonly repeated version of this example ("6 inches at 5 ns is safely lumped") is worth checking against the arithmetic rather than repeating.

Second, at fast CMOS edge rates the critical length is under an inch. Package escapes, via stubs, connector transitions, and series termination resistor placement are all longer than that in electrical terms once you include the vertical structure. This is why termination resistors belong within a fraction of an inch of the driver pin, and why a resistor placed "close enough" at 2 inches is a real reflection source at 500 ps.

Johnson also flags the boundary where these closed-form estimates stop working. Once geometry becomes genuinely three-dimensional or frequencies push into the multi-gigahertz range, non-TEM propagation and complex field interactions break the analytical approximations, and a 3D full-wave solver plus bench measurement becomes mandatory. Knowing where your estimate expires is part of the estimate.

---

## Four parasitics, four equations

Every high-speed failure mode maps onto one of four reactances. Two distort your own signal. Two couple you to someone else's.

### Self capacitance

**I = C dV/dt**

Faster slew into a fixed capacitance demands proportionally more instantaneous current. A driver with finite output impedance feeding that capacitance forms an RC, and the 10-90% rise time through it is approximately **2.2RC**.

Worked: a 30 Ω driver into a 10 pF load gives 2.2 × 30 × 10p = **660 ps** of added transition time. If the driver's intrinsic edge is 1 ns, the composite edge is roughly √(1² + 0.66²) = 1.2 ns, which slows your knee frequency and eats timing margin at the same time.

Check it the other way with the knee frequency. At F_knee = 500 MHz, that 10 pF presents X_C = 1/(2π × 500 MHz × 10 pF) = **32 Ω**. That is the same order as the 30 Ω driver, which tells you immediately the load is a first-order effect and has to be in the model. Had the number come back at 3 kΩ, you could have deleted it from the schematic in your head and moved on.

The current side of the same equation is where power distribution problems originate. Fast edges into fixed capacitance require large instantaneous current, and that current has to come from somewhere within a few hundred picoseconds, which is far too fast for the regulator and entirely the job of the decoupling network.

### Self inductance

**V = L dI/dt**

A switching output pulls a current surge, and that surge crossing the parasitic inductance of the power and ground path produces a voltage across it. The local ground reference of the die shifts relative to system ground, which is ground bounce, or simultaneous switching noise once several outputs do it together.

Worked: one output driving a 50 Ω line to 3.3 V sources 66 mA. Delivered in 1 ns, that is 6.6 × 10⁷ A/s. Across a 5 nH package ground lead, that is **0.33 V** of bounce. Switch eight outputs on the same lead simultaneously and you get **2.6 V**, which is not a margin problem but a functional failure. This is the entire reason wide buses on cheap packages with one ground pin were a catastrophe in the TTL era and the reason modern BGAs distribute dozens of ground balls.

Run the modern version: 20 outputs at 20 mA with 500 ps edges through a single 0.5 nH ball gives 0.4 V. Spread across ten balls in parallel and the effective inductance drops toward 0.05 nH, and the bounce with it. Ground ball count is a signal integrity parameter, not a mechanical one.

The deeper point is that **inductance is a property of a current loop, not a wire**. Total loop inductance scales with the physical area enclosed by the outgoing signal path and its return path. Bring the return closer and the area shrinks. Because the return current flows opposite to the signal current, mutual inductance between the two partially cancels the self inductance of each. That single fact is the theoretical seed of every ground plane rule in the rest of the book: continuous reference planes, no splits under high-speed traces, stitching vias next to every layer-changing signal via so the return current has a low-area path to follow.

The same equation governs decoupling. A 100 nF capacitor at 500 MHz has 3 mΩ of capacitive reactance, which is irrelevant, because 1.5 nH of mounting loop inductance at that frequency presents **4.7 Ω**. The capacitor value is nearly immaterial above a few tens of megahertz. What you are actually specifying when you place a decoupling capacitor is the mounting geometry: pad-to-via distance, via count, and the distance from the cap's loop to the plane pair.

### Mutual capacitance

**I = C_M dV/dt**

Electric field coupling between conductors. A rapidly changing aggressor voltage drives displacement current into a nearby victim. Faster edges, proportionally more coupled current, which is another entry in the case against unnecessarily fast logic.

### Mutual inductance

**V = L_M dI/dt**

Magnetic coupling between current loops. Changing aggressor current produces changing flux through the loop formed by the victim and its return, inducing a voltage by Faraday's law.

---

## Why near-end and far-end crosstalk behave differently

The two mutual terms together produce all crosstalk, and their relative polarity is what makes the near end and far end behave nothing alike.

Capacitively coupled current enters the victim node and divides, traveling both directions with the same polarity. Inductively coupled current circulates: by Lenz's law it opposes the aggressor current, so it flows backward on the victim.

**Backward, toward the victim's driver (NEXT):** the capacitive and inductive contributions travel the same direction and add. The coupling coefficient goes as (C_M + L_M), constructive. NEXT amplitude grows with parallel run length until the run exceeds half the spatial length of the edge, at which point it saturates:

**L_sat = Tr × v / 2**

For a 500 ps edge in stripline that is 1.4 inches. Past that, a longer parallel run does not make near-end crosstalk worse. It makes the noise pulse wider, not taller. This is why "shorten the parallel run" as a fix stops working after about an inch and a half, and why separation and reference-plane proximity are the real levers.

**Forward, toward the victim's receiver (FEXT):** the capacitive term travels forward and the inductive term travels backward, so at the far end they subtract. The coefficient goes as (C_M − L_M), destructive.

Whether that subtraction cancels completely depends on geometry, and this is the practical payoff:

- **Stripline**, buried in homogeneous FR-4, has capacitive and inductive coupling coefficients that are equal. The terms cancel and FEXT is theoretically zero.
- **Microstrip** sits in an inhomogeneous medium of FR-4 and air. Magnetic fields largely ignore the dielectric boundary, so mutual inductance stays strong, while part of the electric field runs through the low-permittivity air, weakening mutual capacitance. The imbalance blocks cancellation, and FEXT accumulates linearly with parallel length, arriving at the receiver as a sharp spike coincident with the edge.

| | NEXT | FEXT |
|---|---|---|
| Direction | Backward to driver | Forward to receiver |
| Superposition | C_M + L_M (constructive) | C_M − L_M (destructive) |
| Length dependence | Saturates past Tr·v/2 | Grows linearly |
| Stripline | High | Near zero |
| Microstrip | Very high | Moderate to high |

The design consequence is direct: long parallel runs of edge-sensitive signals belong on stripline. If a bus has to run six inches next to an aggressor, burying it does not just reduce far-end crosstalk, it can remove the mechanism. Surface routing keeps FEXT on the table permanently.

For the rigorous version of all this, the scalar L and C become N × N matrices for N coupled conductors, with self terms on the diagonal and mutual terms off it, solved through the Telegrapher's equations in matrix form. Clayton Paul's *Analysis of Multiconductor Transmission Lines* is the standard treatment and the theoretical basis under every commercial field solver you will use.

---

## What eats the edge on long runs

Once spectral content pushes into the gigahertz, the lossless-conductor and perfect-dielectric assumptions fail through three mechanisms.

**Skin effect.** Time-varying current generates an internal magnetic field that induces eddy currents opposing flow at the center of the conductor and reinforcing it at the perimeter. Current migrates outward into a surface layer of depth

**δ = √(ρ / πμf)**

For copper: 66 µm at 1 MHz, 6.6 µm at 100 MHz, **2.9 µm at 500 MHz**, 2.1 µm at 1 GHz. One-ounce copper is 35 µm thick, so at 500 MHz the current occupies under a tenth of the metal you paid for. Effective cross-section shrinks as 1/√f, so AC resistance rises as √f. Proximity effect compounds it: return current on the adjacent plane crowds the signal current toward the facing surface, pushing resistance above the plain skin-effect prediction. The DC resistance in a wire table is close to useless for estimating high-frequency loss.

**Dielectric loss.** The laminate is an imperfect insulator. Alternating fields force polarized molecular dipoles in the resin to reorient continuously, and that molecular friction converts signal energy into heat. Dielectric loss grows roughly linearly with frequency, characterized by the loss tangent, so it starts below skin-effect loss and eventually overtakes it. Above that crossover the line is dielectric-loss-limited, which puts a hard ceiling on trace length. The 1993 edition treats this briefly because it was modest at the frequencies of the era; the 2003 follow-on, *High-Speed Signal Propagation: Advanced Black Magic*, expands it substantially, and that is the better reference for anything above a gigahertz.

**Surface roughness.** Copper foil is deliberately roughened for adhesion to the laminate. Once skin depth drops below the tooth profile, current is forced to follow the jagged contour, lengthening the effective path and raising resistance. At 500 MHz the skin depth is 2.9 µm and standard HTE foil has teeth of comparable size, so this is not an exotic multi-gigahertz concern.

The historical model is Hammerstad-Jensen, which scales smooth-copper resistance by a factor derived from a single RMS tooth height. It works below roughly 5 GHz and then fails badly, predicting a saturation of loss that underestimates real attenuation. Huray replaced it with a physics-based scattering model built from SEM imagery, treating the electrodeposited surface as a three-dimensional field of conductive spheres (the "snowball" model) sitting on a matte base, with the correction factor computed from sphere radius and areal density. Because measuring those radii requires destructive cross-sectioning, Bert Simonovich's Cannonball-Huray adaptation assumes hexagonal close packing and derives the parameters from the roughness numbers already on the laminate datasheet.

Practically: when you specify a laminate for a fast interface, the foil type (HTE, VLP, HVLP) belongs in the stackup spec alongside the dielectric constant, and the fab drawing needs to say so. Substituting foil is an easy cost-down for a fabricator and a silent loss budget change for you.

---

## What you carry forward

Three habits, and they cover most of what you will do in a layout review.

**The bandwidth proxy.** F_knee = 0.5/Tr, computed from the datasheet transition time of the actual part you are using, not the clock. Every frequency-domain judgment in the design gets evaluated there.

**The spatial threshold.** Delay against Tr/6 decides whether a structure is a lumped R/L/C or a transmission line. Compute it for the fastest edge on the board and post the resulting critical length where the layout engineer can see it.

**The reactance evaluation.** For every parasitic, compute ωL or 1/ωC at F_knee and compare against the surrounding impedance. If it is negligible there, delete it from your mental model with confidence. If it is comparable, it is a first-order effect and belongs in the simulation.

For anyone making architecture and staffing calls rather than routing: the reason this chapter is worth thirty pages of a CTO's attention is that it converts a class of problems usually discovered on the bench, at EMC, or in the field into arithmetic performed before layout. The inputs are the transition times of the parts you selected and the physical dimensions of the board you drew. Both are known weeks before the first prototype exists. The cost of skipping the arithmetic is measured in respins, and the respins tend to arrive at the schedule's least forgiving moment.