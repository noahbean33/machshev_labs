# High-Speed Digital Design (Johnson & Graham) — Chapter 1: Fundamentals

*Summary notes on Chapter 1, with the causal mechanisms filled in and the worked arithmetic carried
through. Every formula here is checked numerically in the companion notebook,
`chapter1_fundamentals.ipynb`.*

---

## 0. What "high speed" means

A circuit is high speed when the **rise time of the signal is short compared to the propagation delay
through the interconnect**. Clock frequency is not the criterion. A 1 MHz clock built from a 200 ps
logic family is a high-speed design problem; a 100 MHz clock with 5 ns edges over short traces may
not be.

Put the same claim the other way round: a 10 MHz board with 500 ps edges is a high-speed board. It
will ring, it will couple into its neighbours, it will bounce its own ground reference, and it will
fail EMC. The number printed on the oscillator tells you almost nothing about any of that. The
transition time does.

Everything in Chapter 1 follows from this: the relevant frequency content is set by the *edge*, not
the *repetition rate*.

The through-line of the chapter is that every rule of thumb is a bounded estimate with a stated error
bar. Johnson's argument throughout is that a rough calculation you actually perform beats an exact
simulation you never run because you lack the time, the field solver licence, or the material data.
That argument holds up.

---

## 1. Frequency, Time, and Distance

### 1.1 Where the energy actually is

Start with the spectrum, because everything downstream is a consequence of it.

A digital clock is not a square wave. It is a **trapezoid**: period $T$, pulse width $\tau$, and a
10–90% transition time $T_r$. Its Fourier coefficients are the product of two sinc functions, one
contributed by the pulse width and one by the ramp:

$$a_n = 2A\,\frac{\tau}{T}\;\mathrm{sinc}\!\left(\frac{n\tau}{T}\right)\mathrm{sinc}\!\left(\frac{nT_r}{T}\right),
\qquad \mathrm{sinc}(x) = \frac{\sin \pi x}{\pi x}$$

Each sinc contributes one corner to the spectral envelope and one extra 20 dB/decade of rolloff. So
the envelope has three regions:

- **Flat** at low frequency.
- **−20 dB/decade** above $f_1 = 1/(\pi\tau)$. This break is set by the pulse width, and therefore by
  the clock period.
- **−40 dB/decade** above $f_2 = 1/(\pi T_r)$. **This break is set by the rise time.**

Above the second break, energy falls off fast enough that the circuit's behaviour up there stops
mattering to the shape of the edge. The rise time, not the clock period, sets the outer boundary of
the signal's meaningful spectral content. **That is the mathematical content of section 0.**

Two bookkeeping notes, because both bite when you check the numbers:

- The first break is often quoted as $1/(\pi T)$. The exact corner is at $1/(\pi\tau)$, which for a
  50% duty cycle is $2/(\pi T)$. It is an order-of-magnitude statement, not an identity.
- In the trapezoid model above, $T_r$ is the **full 0–100% ramp**, while every datasheet quotes
  **10–90%**. For a linear ramp the 10–90% figure is $0.8\times$ the full transition, so the two
  conventions differ by 25%. This is one more reason the coefficient in $F_{knee}$ below is margin
  rather than precision.

### 1.2 Knee frequency

$$F_{knee} = \frac{0.5}{T_r}$$

where $T_r$ is the **10–90% rise time** of the fastest edge in the system.

The exact envelope break is $1/(\pi T_r) = 0.318/T_r$. Johnson rounds **up** to $0.5/T_r$ to account
for how energy really distributes across a realistic transition and to leave the estimate
conservative. It is a deliberately loose number, and its looseness is the point.

$F_{knee}$ is the frequency below which most of the energy in a digital edge is concentrated. Three
consequences, and these are the load-bearing claims of the chapter:

1. Circuit behaviour **at** $F_{knee}$ determines how the circuit processes a step edge.
2. Any circuit with flat frequency response out to $F_{knee}$ passes a step with acceptable fidelity.
3. Circuit behaviour **above** $F_{knee}$ has little effect on digital performance.

General principle behind it: high-frequency response governs short-time-scale behaviour (edges,
reflections, ringing); low-frequency response governs long-time-scale behaviour (droop, baseline
wander, DC offset).

**What it buys you is a replacement for Fourier analysis.** When you find a parasitic on the board,
you evaluate its impedance at $F_{knee}$, compare that against the characteristic impedance of the
circuit around it, and decide in one line whether it matters. No harmonic sum, no simulation.

| Logic family | Typical $T_r$ | $F_{knee}$ |
|---|---|---|
| Standard TTL | 5 ns | 100 MHz |
| LS TTL | 2 ns | 250 MHz |
| Fast CMOS | 1 ns | 500 MHz |
| ACT / LVCMOS | 600 ps | 833 MHz |
| LVDS | 300 ps | 1.7 GHz |
| DDR4 | 100 ps | 5 GHz |
| SerDes (PAM4) | 30 ps | 17 GHz |

### 1.3 Knee frequency is not the 3 dB bandwidth

$$F_{3dB} = \frac{K}{T_r}$$

- $K = 0.338$ for a Gaussian step response
- $K = 0.350$ for a single-pole exponential (RC) step response

Practical value: $F_{3dB} \approx 0.35/T_r$.

**These are two different numbers and the notes should keep them separate.** $F_{3dB} = 0.35/T_r$ is
a measured, physically defined quantity. $F_{knee} = 0.5/T_r$ is a deliberately conservative
engineering heuristic sitting ~43% above the 3 dB point. Johnson picks the higher number so that a
circuit judged acceptable at $F_{knee}$ has margin. Do not use $F_{knee}$ in a rigorous filter
calculation; use it to decide what matters.

Related rule for cascaded systems, used throughout the measurement sections below:

$$T_{measured} \approx \sqrt{T_{signal}^2 + T_{scope}^2 + T_{gen}^2}$$

Root-sum-square combination, valid when each stage is roughly Gaussian.

### 1.4 The corollary: gratuitous speed is a liability

Specify a driver with a 1 ns edge for a timing budget that a 5 ns edge would satisfy, and you have
moved $F_{knee}$ from 100 MHz to 500 MHz. Every series inductance on the board just became five times
more reactive. Every shunt capacitance became five times more conductive. Ground bounce, reflections
and crosstalk all scale with it, and you bought none of it deliberately.

This is the first place the physics reaches into procurement. Drive strength and slew rate are
configurable on most modern parts. **Set them to the slowest edge that closes timing, and record why
in the design file** — otherwise the next person to touch the BOM will treat "faster part, same
price" as a free upgrade.

### 1.5 Time and distance: propagation delay

Signals travel as electromagnetic waves at a velocity fixed by the dielectric around them:

$$v = \frac{c}{\sqrt{\varepsilon_{r,eff}}}, \qquad D = \frac{1}{v} = 85\sqrt{\varepsilon_{r,eff}}\ \ \text{ps/in}$$

In vacuum $c$ is 11.8 in/ns — round to 12 for mental arithmetic — which gives the 85 ps/in reference.

| Medium | $\varepsilon_{r,eff}$ | Delay (ps/in) | Velocity (in/ns) |
|---|---|---|---|
| Air / free space | 1.0 | 85 | 11.8 |
| Coax, 75% velocity factor | 1.8 | 113 | 8.9 |
| Coax, 66% velocity factor | 2.3 | 129 | 7.8 |
| FR-4 outer layer (microstrip) | 2.8–4.5, typ. 3.1 | 140–180, typ. 149 | ~6.7 |
| FR-4 inner layer (stripline) | ~4.5 | ~180 | ~5.6 |
| Alumina inner layer | ~10 | 240–270 | ~3.7 |

The stripline number falls out of $D = 85\sqrt{\varepsilon_r}$ with $\varepsilon_r \approx 4.5$.
Alumina at $\varepsilon_r \approx 10$ gives $85\sqrt{10} \approx 270$.

**Microstrip is faster than stripline on the same board**, because part of its field returns through
air and the effective dielectric constant drops below the bulk substrate value. Note that microstrip
is quoted as a *range*, not a value: $\varepsilon_{r,eff}$ depends on the trace geometry. A wide
trace close to the plane concentrates more field in the laminate and behaves more like stripline; a
narrow trace lets more field into the air. The Hammerstad closed form:

$$\varepsilon_{r,eff} = \frac{\varepsilon_r + 1}{2} + \frac{\varepsilon_r - 1}{2}\left(1 + \frac{12h}{w}\right)^{-1/2}$$

The limits fall out of that expression directly: a very narrow trace tends to
$(\varepsilon_r+1)/2 = 2.75$, giving 141 ps/in, and a very wide one tends to the bulk 4.5, giving
180 ps/in. That is the entire span of the microstrip row above. **A microstrip delay number quoted
without its geometry is a range, not a value.**

### 1.6 Length of the rising edge

$$l = T_r \times v = \frac{T_r}{D}$$

with $T_r$ in ps and $D$ in ps/in, giving $l$ in inches. This is the physical distance the leading
edge occupies in the medium while it is in transition — the span between the point where the voltage
starts to leave logic-low and the point where it arrives at logic-high, **existing simultaneously on
the same conductor**.

Getting that picture in your head is what makes section 2 obvious rather than memorised.

| $T_r$ | Edge length, stripline | Edge length, microstrip |
|---|---|---|
| 5 ns | 27.8 in | 33.6 in |
| 2 ns | 11.1 in | 13.4 in |
| 1 ns | 5.6 in | 6.7 in |
| 500 ps | 2.8 in | 3.4 in |
| 300 ps | 1.7 in | 2.0 in |
| 100 ps | 0.56 in | 0.67 in |
| 30 ps | 0.17 in | 0.20 in |

### 1.7 Match in picoseconds, not inches

The stripline/microstrip velocity difference is not a rounding detail. Outer-layer routing is
meaningfully faster than inner-layer routing, which matters for any matched-length group that changes
layers partway.

Take a 6-inch differential or bussed pair, length-matched in the layout tool. Route one member
entirely on an outer layer and its partner entirely on an inner layer, and it arrives
$6 \times (180 - 149) = 186$ ps early — with the tool reporting zero length mismatch. At 8 GT/s that
is one and a half unit intervals. Even 20% of the route on the wrong layer burns a quarter of a UI.

**Length matching in inches is wrong across a layer transition. Match in picoseconds.**

---

## 2. Lumped versus Distributed

### 2.1 The rule

**A circuit is lumped if its physical extent is less than $l/6$.**

$$L_{crit} = \frac{l}{6} = \frac{T_r \times v}{6}$$

Continuing the example above, a 1 ns edge on FR-4 stripline gives a lumped-circuit threshold of about
0.93 in. Beyond that, transmission line behaviour.

Why this matters:

- **Lumped**: ordinary circuit theory applies. Voltage is the same everywhere on a node at any
  instant. KVL/KCL, no wave propagation, no characteristic impedance, no termination required. R/L/C
  elements with no physical extent describe the structure completely.
- **Distributed**: the signal exists as a travelling wave, and several distinct voltage levels
  coexist along the conductor at once. You need transmission line analysis: phase delay,
  characteristic impedance, and a termination strategy.

**Note that the threshold scales with $T_r$ and does not contain clock period anywhere.** Shrinking
rise time by 10× shrinks the lumped-circuit budget by 10× on an otherwise unchanged board.

### 2.2 Critical length

| $T_r$ | Critical length, stripline | Critical length, microstrip |
|---|---|---|
| 5 ns | 4.63 in | 5.59 in |
| 1 ns | 0.93 in | 1.12 in |
| 500 ps | 0.46 in | 0.56 in |
| 300 ps | 0.28 in | 0.34 in |
| 100 ps | 0.093 in | 0.112 in |
| 30 ps | 0.028 in | 0.034 in |

At fast CMOS edge rates the critical length is **under an inch**. Package escapes, via stubs,
connector transitions and series termination resistor placement are all longer than that in
electrical terms once you include the vertical structure.

This is why termination resistors belong within a fraction of an inch of the driver pin, and why a
resistor placed "close enough" at 2 inches is a real reflection source at 500 ps — it sits about 4×
past the threshold.

### 2.3 Where the factor of 6 comes from

The 1/6 is a **convention**, not physics. Some designers use 1/4 (more permissive) or 1/10 (more
conservative). Nothing happens at the boundary; the error in the lumped approximation grows
continuously.

Johnson justifies the 6 by tolerating "something in the range of 15 to 20 percent reflection error."
That is checkable, and worth checking, because the answer has a condition attached. Drive a lossless
line of one-way delay $T_D$ from a source impedance $R_s$ into a high-impedance CMOS input, sum every
reflection, and measure the overshoot at the receiver:

$$V_{load}(t) = \frac{Z_0}{Z_0+R_s}(1+\Gamma_L)\sum_{k\ge 0}(\Gamma_s\Gamma_L)^k\,
\mathrm{ramp}\!\left(t - (2k{+}1)T_D\right)$$

Sweeping that numerically (see the companion notebook), at $T_D = T_r/6$:

| Source impedance | Overshoot at $T_D = T_r/6$ |
|---|---|
| 5 Ω | 23% |
| 10 Ω | 17% |
| 20 Ω | 11% |
| 30 Ω | 7% |
| 50 Ω (matched) | 0% |

**So the 15–20% figure is a worst-case-driver statement, not a universal one.** If your driver is
series-terminated near $Z_0$, the divisor 6 is conservative. If it is a stiff 5 Ω output, 6 is
optimistic and you want 10. The condition belongs with the rule.

### 2.4 Checking the folk example

The commonly repeated version of this — *"6 inches at 5 ns is safely lumped"* — is worth checking
against the arithmetic rather than repeating:

```
6-inch stripline, 5 ns edge
  one-way delay        = 6 × 180 ps = 1.08 ns
  lumped budget Tr/6   = 0.83 ns
  ratio                = 1.3× → over the limit
```

Marginally over. Not a disaster, but not the comfortable lumped case it is usually described as
either.

Now hold the trace fixed and change only the edge. The same 6 inches driven with a 500 ps edge is
**13× past the threshold — at any clock rate whatsoever, including DC with one transition per hour.**

### 2.5 Where these estimates expire

Johnson is explicit that the closed forms stop working once geometry becomes genuinely
three-dimensional or frequencies push into the multi-gigahertz range. Non-TEM propagation and complex
field interaction break the analytical approximations, and a 3D full-wave solver plus bench
measurement becomes mandatory.

Knowing where your estimate expires is part of the estimate.

---

## 3. Four Kinds of Reactance

The chapter organises parasitics into a 2×2: self versus mutual, electric versus magnetic.

| | Electric field | Magnetic field |
|---|---|---|
| **Self** | Ordinary capacitance — $I = C\,dV/dt$ | Ordinary inductance — $V = L\,dI/dt$ |
| **Mutual** | Mutual capacitance — $I_m = C_m\,dV_A/dt$ | Mutual inductance — $V_B = L_m\,dI_A/dt$ |

Two of them distort your own signal. Two of them couple you to someone else's. Every high-speed
failure mode maps onto one of the four.

Note that $T_r$ appears in the denominator of every consequence that follows from these. **Faster
edges make all four worse**, which is the whole point of the chapter and the reason section 1.4 is a
design rule and not a preference.

---

## 4. Ordinary Capacitance

Arises between any two conducting bodies held at different potentials.

### 4.1 Reactance at the knee frequency

$$X_C = \frac{1}{2\pi F_{knee} C} = \frac{1}{2\pi (0.5/T_r) C} = \frac{T_r}{\pi C}$$

It is $T_r$ divided by the product $\pi C$ — see errata item 1.

**Worked example:** $C = 10$ pF, $T_r = 1$ ns → $X_C = 10^{-9}/(\pi \cdot 10^{-11}) = 31.8\ \Omega$.

**How to use it:** compare $X_C$ to the surrounding circuit impedance. A 10 pF load looking like 32 Ω
against a 50 Ω driver is a first-order problem and has to be in the model. Against a 10 kΩ node it is
irrelevant. Had the number come back at 3 kΩ — a 0.1 pF via stub, say — you could delete it from the
schematic in your head and move on.

### 4.2 The time-domain view: 2.2RC

A driver with finite output impedance feeding that capacitance forms an RC, and the 10–90% rise time
through it is approximately $2.2RC$.

**Worked example:** a 30 Ω driver into a 10 pF load gives $2.2 \times 30 \times 10\text{p} = 660$ ps
of added transition time. If the driver's intrinsic edge is 1 ns, the composite edge is

$$\sqrt{1.00^2 + 0.66^2} = 1.20\ \text{ns}$$

which slows your knee frequency from 500 MHz to 417 MHz and eats timing margin at the same time.

Note that the two routes agree: 32 Ω of reactance against a 30 Ω driver (frequency domain) and 660 ps
against a 1 ns edge (time domain) are the same statement. **When the reactance at $F_{knee}$ is the
same order as the surrounding impedance, the parasitic is first-order.** That is the whole
methodology in one sentence.

### 4.3 The current side: where PDN problems start

$$I = C\frac{dV}{dt} \approx \frac{C\,\Delta V}{T_r}$$

Faster slew into a fixed capacitance demands proportionally more instantaneous current. That current
has to come from somewhere within a few hundred picoseconds — far too fast for the regulator, and
entirely the job of the decoupling network. See section 5.4.

### 4.4 Capacitance test jig

Pulse generator with a fast edge drives the unknown capacitance through a known source resistance
$R_s$; scope observes the node.

- The observed 10–90% rise time is $T_r = 2.2 R_s C$, so $C = T_r/(2.2 R_s)$.
- **Subtract instrument contributions in RSS before back-calculating.** If the generator and scope
  contribute comparable rise times to the measurement, the raw number is badly wrong.
- Keep $R_s$ large enough that the RC time constant dominates the generator's own edge, small enough
  that stray capacitance in the fixture stays negligible.

---

## 5. Ordinary Inductance

Arises wherever current flows in a loop. The current builds a magnetic field, the field stores energy,
and that energy cannot be established or removed instantaneously. Inductance is the measure of that
reluctance to change.

### 5.1 Reactance at the knee frequency

$$X_L = 2\pi F_{knee} L = \frac{\pi L}{T_r}$$

**Worked example:** $L = 10$ nH, $T_r = 1$ ns → $X_L = \pi \cdot 10^{-8}/10^{-9} = 31.4\ \Omega$.

Note the symmetry with the capacitance example: at 1 ns edges, **10 pF and 10 nH are equally
significant parasitics against a ~50 Ω environment.** Useful pair of numbers to memorise.

### 5.2 Ground bounce and simultaneous switching noise

$$V = L\frac{dI}{dt}$$

A switching output pulls a current surge, and that surge crossing the parasitic inductance of the
power and ground path produces a voltage across it. The die's local ground reference shifts relative
to system ground. That is **ground bounce**, and once several outputs do it together, **simultaneous
switching noise (SSN)**.

**Worked example, TTL era.** One output driving a 50 Ω line to 3.3 V sources 66 mA. Delivered in
1 ns, that is $6.6 \times 10^7$ A/s. Across a 5 nH package ground lead:

$$V = 5\,\text{nH} \times 6.6\times10^7\ \text{A/s} = 0.33\ \text{V}$$

Switch eight outputs on the same lead simultaneously and you get **2.6 V**, which is not a margin
problem but a functional failure. This is the entire reason wide buses on cheap packages with one
ground pin were a catastrophe in the TTL era, and the reason modern BGAs distribute dozens of ground
balls.

**Worked example, modern.** 20 outputs at 20 mA with 500 ps edges through a single 0.5 nH ball gives
0.4 V. Spread across ten balls in parallel and the effective inductance drops toward 0.05 nH, and the
bounce with it — to 40 mV.

| Ground balls in parallel | Bounce, 20 outputs @ 20 mA, 500 ps |
|---|---|
| 1 | 400 mV |
| 4 | 100 mV |
| 10 | 40 mV |
| 20 | 20 mV |

**Ground ball count is a signal integrity parameter, not a mechanical one.**

### 5.3 Inductance is a property of a loop, not a wire

A "ground pin inductance" figure is meaningless without specifying the return path.

Total loop inductance scales with the **physical area enclosed** by the outgoing signal path and its
return path. Bring the return closer and the area shrinks. And because the return current flows
*opposite* to the signal current, mutual inductance between the two **partially cancels the self
inductance of each** — so the loop is worth less than the sum of its wires, and worth progressively
less as you tighten it.

That single fact is the theoretical seed of every ground plane rule in the rest of the book:

- continuous reference planes,
- no splits under high-speed traces,
- a stitching via next to every layer-changing signal via, so the return current has a low-area path
  to follow.

A return current forced to detour around a plane split encloses a much larger loop. A detour measured
in tenths of an inch can add inductance comparable to inches of ordinary, well-referenced routing.

### 5.4 Decoupling is a geometry specification

The same equation governs decoupling, and the result is counterintuitive.

A 100 nF capacitor at 500 MHz has

$$X_C = \frac{1}{2\pi (5\times10^8)(10^{-7})} = 3.2\ \text{m}\Omega$$

which is irrelevant — because 1.5 nH of mounting loop inductance at that frequency presents

$$X_L = 2\pi (5\times10^8)(1.5\times10^{-9}) = 4.7\ \Omega$$

Above self-resonance every capacitor value collapses onto the same $\omega L$ line. **The capacitor
value is nearly immaterial above a few tens of megahertz.** Changing the part number does nothing
there; changing the footprint moves the impedance curve by an order of magnitude.

What you are actually specifying when you place a decoupling capacitor is the **mounting geometry**:
pad-to-via distance, via count, and the distance from the cap's loop to the plane pair.

### 5.5 Inductance test jig and the area method (Section 1.6)

Drive a fast step into the inductance in series with a resistor $R$; the scope sees a voltage spike
decaying with time constant $\tau = L/R$.

**Better method than eyeballing the decay: integrate.** For an exponential decay of initial amplitude
$V_0$,

$$\text{Area} = \int_0^\infty V_0 e^{-t/\tau}\,dt = V_0\tau \quad\Rightarrow\quad \tau = \frac{\text{Area}}{V_0}$$

and $L = \tau R$.

Why this is the right technique: **a slow generator edge or a bandwidth-limited scope smears the
waveform but preserves its area.** Integration is linear, and any DC-accurate measuring system has
unit area in its impulse response. So the area measurement is immune to exactly the instrument
limitations that corrupt a direct time-constant reading.

Simulated against a 10 nH / 50 Ω jig ($\tau = 200$ ps), the difference is stark: as scope bandwidth
falls the observed peak collapses from 0.96 V to 0.40 V and a fit to the visible decay overstates $L$
by more than 100%, while the area method stays within a fraction of a percent throughout — even with
a scope slower than the signal.

This is the single most useful lab trick in the chapter.

**Caveat:** it depends on the scope's low-frequency and DC path being accurate. **AC coupling
destroys the measurement.**

---

## 6. Mutual Capacitance

Two circuits, physically adjacent. Voltage in circuit A creates an electric field; that field
terminates partly on circuit B and injects current into it. The coupling coefficient is the mutual
capacitance $C_m$, in farads.

$$I_m = C_m\frac{dV_A}{dt}$$

For a step of amplitude $\Delta V$ and rise time $T_r$, $dV_A/dt \approx \Delta V/T_r$, so

$$I_m \approx \frac{C_m \Delta V}{T_r}$$

That current develops a voltage across the victim's impedance to ground, $R_B$ (in a jig with both
ends terminated, the parallel combination of the two terminations):

$$\text{Crosstalk} = \frac{V_B}{\Delta V} = \frac{C_m R_B}{T_r}$$

Faster edges, proportionally more coupled current — another entry in the case against unnecessarily
fast logic.

Coupling falls off rapidly with separation. For microstrip over a plane the backward coupling
coefficient goes roughly as $1/(1 + (s/h)^2)$, where $s$ is trace separation and $h$ the dielectric
height. Doubling the spacing from $1h$ to $2h$ cuts coupling by 2.5×; going to $3h$ cuts it 5×. Past
about $4h$ you are spending routing channel for very little return, which is where the folk "3h rule"
comes from.

Note the falloff is steep **only because a reference plane is close by**. Without one the fields
spread and the rule collapses.

---

## 7. Mutual Inductance

Two current loops. Current in loop A creates a magnetic field; flux from that field links loop B and
induces a voltage by Faraday's law. The coefficient is mutual inductance $L_m$, in henries
(volt-seconds per amp).

$$V_B = L_m\frac{dI_A}{dt}$$

The induced quantity is a **voltage** — see errata item 2.

With circuit A driven by a step $\Delta V$ through source resistance $R_A$, the current slew rate is
$dI_A/dt = \Delta V/(R_A T_r)$, so

$$V_B = \frac{L_m \Delta V}{R_A T_r} \quad\Rightarrow\quad \text{Crosstalk} = \frac{V_B}{\Delta V} = \frac{L_m}{R_A T_r}$$

**The rise time is in the denominator**, not multiplied — see errata item 3. Crosstalk gets *worse* as
edges get faster.

---

## 8. Which mechanism dominates

Take the ratio of the two crosstalk expressions, using a common impedance $R$ for both:

$$\frac{\text{capacitive}}{\text{inductive}} = \frac{C_m R / T_r}{L_m/(R\,T_r)} = \frac{C_m R^2}{L_m}$$

**The $T_r$ cancels. Only impedance decides.**

- **Low-impedance circuits** → inductive coupling dominates.
- **High-impedance circuits** → capacitive coupling dominates.

The crossover sits at $R = \sqrt{L_m/C_m}$. And here is the mechanism behind that, which is worth
stating explicitly because it explains why the crossover is never far away:

$$\sqrt{\frac{L_m}{C_m}} = Z_0\sqrt{\frac{L_m/L}{C_m/C}}$$

That second square root is close to 1 for any realistic coupled pair — the coupling ratios are
similar in magnitude even when they are not equal. **So the crossover always lands near the
characteristic impedance of the coupled structure.** It is not a coincidence, and it gets developed
in the transmission line chapters.

Which means the chapter's closing claim needs its condition attached. Digital circuits are generally
low-impedance: driver output impedances of tens of ohms, transmission lines at 50–100 Ω, large
transient currents. So **mutual inductance is usually the worse offender in high-speed digital
design** — but that is a statement about *driver and return-path impedances sitting below $Z_0$*, not
a universal property of PCBs. Worked at three impedances with representative $C_m = 0.5$ pF,
$L_m = 2$ nH:

| Circuit impedance | $C_m R^2/L_m$ | Verdict |
|---|---|---|
| 30 Ω (driver) | 0.23 | inductive wins ~4× |
| 50–65 Ω (line, crossover) | ~1 | comparable |
| 10 kΩ (analogue node) | 25 000 | capacitive wins by four decades |

Move to a high-impedance analogue node and capacitive coupling takes over completely. See errata
item 7.

---

## 9. Near-end versus far-end crosstalk

Chapter 1 does not cover this — it presents the two mutual mechanisms as a lumped comparison and
stops. But the lumped comparison should not be over-applied to long parallel runs, and the reason is
worth carrying forward now rather than discovering later.

### 9.1 Why the polarities differ

The two mutual terms together produce all crosstalk, and their **relative polarity** is what makes the
near end and far end behave nothing alike.

- **Capacitively** coupled current enters the victim node and divides, travelling both directions
  with the same polarity.
- **Inductively** coupled current circulates: by Lenz's law it opposes the aggressor current, so it
  flows *backward* on the victim.

**Backward, toward the victim's driver (NEXT):** the two contributions travel the same direction and
**add**.

$$K_b = \tfrac{1}{4}\left(\frac{C_m}{C} + \frac{L_m}{L}\right) \qquad \text{constructive}$$

**Forward, toward the victim's receiver (FEXT):** the capacitive term travels forward and the
inductive term backward, so at the far end they **subtract**.

$$K_f = -\tfrac{1}{2}\left(\frac{L_m}{L} - \frac{C_m}{C}\right) \qquad \text{destructive}$$

### 9.2 NEXT saturates

NEXT amplitude grows with parallel run length until the run exceeds half the spatial length of the
edge, at which point it **saturates**:

$$L_{sat} = \frac{T_r \times v}{2}$$

For a 500 ps edge in stripline that is **1.4 inches**. Past that, a longer parallel run does not make
near-end crosstalk worse — it makes the noise pulse *wider*, not taller. The pulse duration is
$2T_D$, set by the line delay, independently of $T_r$.

This is why "shorten the parallel run" as a fix stops working after about an inch and a half, and why
separation and reference-plane proximity are the real levers.

| $T_r$ | $L_{sat}$, stripline | $L_{sat}$, microstrip |
|---|---|---|
| 5 ns | 13.9 in | 16.8 in |
| 1 ns | 2.8 in | 3.4 in |
| 500 ps | 1.4 in | 1.7 in |
| 300 ps | 0.83 in | 1.0 in |

### 9.3 FEXT, and the stripline payoff

FEXT has no such mercy. It grows **linearly with parallel length, without limit**, and arrives as a
sharp spike of width $\approx T_r$ coincident with the edge.

Whether the subtraction in $K_f$ cancels completely depends on geometry, and this is the practical
payoff:

- **Stripline**, buried in homogeneous FR-4, has capacitive and inductive coupling coefficients that
  are **equal**. The terms cancel and FEXT is theoretically **zero**.
- **Microstrip** sits in an inhomogeneous medium of FR-4 and air. Magnetic fields largely ignore the
  dielectric boundary, so $L_m$ stays strong, while part of the electric field runs through the
  low-permittivity air, weakening $C_m$. The imbalance blocks cancellation and FEXT accumulates.

| | NEXT | FEXT |
|---|---|---|
| Direction | Backward, to the driver | Forward, to the receiver |
| Superposition | $C_m + L_m$ (constructive) | $C_m - L_m$ (destructive) |
| Length dependence | Saturates past $T_r v/2$ | Grows linearly |
| Pulse shape | Plateau, width $2T_D$ | Spike, width $\approx T_r$ |
| Stripline | High | Near zero |
| Microstrip | Very high | Moderate to high |

**The design consequence is direct: long parallel runs of edge-sensitive signals belong on
stripline.** If a bus has to run six inches next to an aggressor, burying it does not merely reduce
far-end crosstalk — it can remove the mechanism. Surface routing keeps FEXT on the table permanently.

### 9.4 The rigorous version

For $N$ coupled conductors the scalar $L$ and $C$ become $N \times N$ matrices, with self terms on the
diagonal and mutual terms off it, solved through the Telegrapher's equations in matrix form. Clayton
Paul's *Analysis of Multiconductor Transmission Lines* is the standard treatment and the theoretical
basis under every commercial field solver you will use.

---

## 10. What you carry forward

Three habits, and they cover most of what you will do in a layout review.

**1. The bandwidth proxy.** $F_{knee} = 0.5/T_r$, computed from the datasheet transition time of the
actual part you are using, **not the clock**. Every frequency-domain judgement in the design gets
evaluated there.

**2. The spatial threshold.** Delay against $T_r/6$ decides whether a structure is a lumped R/L/C or a
transmission line. Compute it for the fastest edge on the board and **post the resulting critical
length where the layout engineer can see it.**

**3. The reactance evaluation.** For every parasitic, compute $\omega L$ or $1/\omega C$ at $F_{knee}$
and compare against the surrounding impedance. If it is negligible there, delete it from your mental
model with confidence. If it is comparable, it is a first-order effect and belongs in the simulation.

The inputs to all three are the transition times of the parts you selected and the physical
dimensions of the board you drew. **Both are known weeks before the first prototype exists.** The cost
of skipping the arithmetic is measured in respins, and respins arrive at the schedule's least
forgiving moment.

---

## 11. Beyond Chapter 1

Three loss mechanisms sit outside this chapter's scope but bound everything in it once spectral
content pushes into the gigahertz, where the lossless-conductor and perfect-dielectric assumptions
fail:

- **Skin effect.** Current migrates into a surface layer of depth $\delta = \sqrt{\rho/\pi\mu f}$ —
  2.9 µm for copper at 500 MHz, against 35 µm of 1 oz plating. Effective cross-section shrinks as
  $1/\sqrt{f}$, so AC resistance rises as $\sqrt{f}$. The DC resistance in a wire table is close to
  useless for estimating high-frequency loss.
- **Dielectric loss.** Grows roughly *linearly* with frequency, so it starts below skin-effect loss
  and eventually overtakes it. Above that crossover the line is dielectric-loss-limited, which puts a
  hard ceiling on trace length.
- **Surface roughness.** Once skin depth drops below the foil tooth profile, current follows the
  jagged contour. At 500 MHz skin depth and standard HTE tooth height are comparable, so this is not
  an exotic multi-gigahertz concern. Foil type (HTE, VLP, HVLP) belongs in the stackup spec alongside
  the dielectric constant — substituting foil is an easy cost-down for a fabricator and a silent loss
  budget change for you.

The 1993 edition treats these briefly because they were modest at the frequencies of the era. The
2003 follow-on, *High-Speed Signal Propagation: Advanced Black Magic*, expands them substantially and
is the better reference for anything above a gigahertz.

---

## Summary of formulas

| Quantity | Expression |
|---|---|
| Spectral envelope breaks | $f_1 = 1/(\pi\tau)$, $f_2 = 1/(\pi T_r)$ |
| Knee frequency | $F_{knee} = 0.5/T_r$ |
| 3 dB bandwidth | $F_{3dB} = K/T_r$, $K = 0.338$ (Gaussian), $0.350$ (single-pole) |
| Rise-time combination | $T_{tot} = \sqrt{\sum_i T_i^2}$ |
| Propagation delay | $D = 85\sqrt{\varepsilon_{r,eff}}$ ps/in |
| Microstrip $\varepsilon_{r,eff}$ | $\frac{\varepsilon_r+1}{2} + \frac{\varepsilon_r-1}{2}(1+12h/w)^{-1/2}$ |
| Edge length | $l = T_r v = T_r/D$ |
| Lumped criterion | physical size $< l/6$ |
| Capacitive reactance at $F_{knee}$ | $X_C = T_r/(\pi C)$ |
| Inductive reactance at $F_{knee}$ | $X_L = \pi L/T_r$ |
| RC rise time | $T_r = 2.2RC$ |
| Charging current | $I = C\,\Delta V/T_r$ |
| Ground bounce | $V = nL\,\Delta I/T_r$, $L$ divided by parallel returns |
| Exponential decay time constant | $\tau = \text{Area}/V_0$ |
| Mutual capacitance current | $I_m = C_m\,dV_A/dt$ |
| Capacitive crosstalk | $C_m R_B/T_r$ |
| Mutual inductance voltage | $V_B = L_m\,dI_A/dt$ |
| Inductive crosstalk | $L_m/(R_A T_r)$ |
| Dominance ratio (cap/ind) | $C_m R^2/L_m$, crossover at $\sqrt{L_m/C_m} \approx Z_0$ |
| NEXT coefficient | $K_b = \tfrac14(C_m/C + L_m/L)$ |
| FEXT coefficient | $K_f = -\tfrac12(L_m/L - C_m/C)$ |
| NEXT saturation length | $L_{sat} = T_r v/2$ |
| Skin depth | $\delta = \sqrt{\rho/\pi\mu f}$ |

---

## Errata found in the original notes

1. $X_C$ written as `t_r / pi * c`; correct grouping is $T_r/(\pi C)$.
2. `Y = L_m dI_a/dt` — the induced quantity is a voltage $V$.
3. `crosstalk = l_m/R_a * t_f` — rise time belongs in the **denominator**: $L_m/(R_A T_r)$. As
   written the expression predicts that crosstalk improves as edges get faster, which inverts the
   entire thesis of the chapter.
4. $F_{3dB}$ and $F_{knee}$ were listed adjacently without distinguishing them; they differ by design
   (0.35 vs 0.5).
5. Mutual capacitance crosstalk expression was absent. The comparison in section 8 depends on having
   both.
6. The delay table was noted as a placeholder; values filled in above.
7. "Mutual inductance is often worse" is true for digital work but is a consequence of low circuit
   impedance, not a universal property. Worth stating the condition — and the mechanism is that
   $\sqrt{L_m/C_m}$ lands near $Z_0$ by construction, so the question is always whether the circuit
   impedance sits above or below the line impedance.

### Added on checking the arithmetic

8. The first spectral break is at $1/(\pi\tau)$, set by the pulse width — $2/(\pi T)$ at 50% duty, not
   $1/(\pi T)$.
9. The trapezoid model's $T_r$ is a 0–100% ramp; datasheets quote 10–90%. The two differ by 0.8×.
10. "6 inches at 5 ns is safely lumped" is false as usually stated: 1.08 ns of delay against a 0.83 ns
    budget, about 1.3× over.
11. The "15–20% reflection error" behind the divisor 6 is worst-case-driver dependent — under 7% at
    30 Ω, over 23% at 5 Ω.
