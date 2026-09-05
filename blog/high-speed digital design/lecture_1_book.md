# High-Speed Digital Design (Johnson & Graham) — Chapter 1: Fundamentals

## 0. What "high speed" means

A circuit is high speed when the **rise time of the signal is short compared to the propagation delay through the interconnect**. Clock frequency is not the criterion. A 1 MHz clock built from a 200 ps logic family is a high-speed design problem; a 100 MHz clock with 5 ns edges over short traces may not be.

Everything in Chapter 1 follows from this: the relevant frequency content is set by the *edge*, not the *repetition rate*.

---

## 1. Frequency, Time, and Distance

### 1.1 Knee frequency

$$F_{knee} = \frac{0.5}{T_r}$$

where $T_r$ is the **10–90% rise time** of the fastest edge in the system.

$F_{knee}$ is the frequency below which most of the energy in a digital edge is concentrated. Three consequences, and these are the load-bearing claims of the chapter:

1. Circuit behavior **at** $F_{knee}$ determines how the circuit processes a step edge.
2. Any circuit with flat frequency response out to $F_{knee}$ passes a step with acceptable fidelity.
3. Circuit behavior **above** $F_{knee}$ has little effect on digital performance.

General principle behind it: high-frequency response governs short-time-scale behavior (edges, reflections, ringing); low-frequency response governs long-time-scale behavior (droop, baseline wander, DC offset).

### 1.2 Relationship to 3 dB bandwidth (correction to your note)

$$F_{3dB} = \frac{K}{T_r}$$

- $K = 0.338$ for a Gaussian step response
- $K = 0.350$ for a single-pole exponential (RC) step response

Practical value: $F_{3dB} \approx 0.35/T_r$.

**These are two different numbers and your notes should keep them separate.** $F_{3dB} = 0.35/T_r$ is a measured, physically defined quantity. $F_{knee} = 0.5/T_r$ is a deliberately conservative engineering heuristic sitting ~43% above the 3 dB point. Johnson picks the higher number so that a circuit judged acceptable at $F_{knee}$ has margin. Do not use $F_{knee}$ in a rigorous filter calculation; use it to decide what matters.

Related rule for cascaded systems (used in the measurement sections below):

$$T_{measured} \approx \sqrt{T_{signal}^2 + T_{scope}^2 + T_{gen}^2}$$

Root-sum-square combination, valid when each stage is roughly Gaussian.

### 1.3 Time and distance: propagation delay

Delay $D$ in ps/inch for common media (speed of light in vacuum = 11.8 in/ns → 85 ps/in):

| Medium | Delay (ps/in) |
|---|---|
| Air / free space | 85 |
| Coax, 75% velocity factor | 113 |
| Coax, 66% velocity factor | 129 |
| FR-4 outer layer (microstrip) | 140–180 |
| FR-4 inner layer (stripline) | ~180 |
| Alumina inner layer | 240–270 |

The stripline number falls out of $D = 85\sqrt{\varepsilon_r}$ with $\varepsilon_r \approx 4.5$. Microstrip is faster because part of the field returns through air, so the effective dielectric constant is lower than the bulk substrate value. Alumina at $\varepsilon_r \approx 10$ gives $85\sqrt{10} \approx 270$.

### 1.4 Length of the rising edge

$$l = \frac{T_r}{D}$$

with $T_r$ in ps and $D$ in ps/in, giving $l$ in inches. This is the physical distance the leading edge occupies in the medium while it is in transition.

Example: 1 ns edge on FR-4 stripline → $l = 1000/180 = 5.6$ in.

---

## 2. Lumped versus Distributed

**Rule: a circuit is lumped if its physical extent is less than $l/6$.**

Continuing the example above, a 1 ns edge on FR-4 stripline gives a lumped-circuit threshold of about 0.93 in. Beyond that, transmission line behavior.

Why this matters:

- **Lumped**: ordinary circuit theory applies. Voltage is the same everywhere on a node at any instant. KVL/KCL, no wave propagation, no characteristic impedance, no termination required.
- **Distributed**: the signal exists as a traveling wave. Voltage differs along the conductor. You need transmission line analysis, characteristic impedance, and termination strategy.

The 1/6 factor is a convention. Some designers use 1/4 (more permissive) or 1/10 (more conservative). Nothing physical happens at the boundary; the error in the lumped approximation grows continuously.

Note that the threshold scales with $T_r$, not with clock period. Shrinking rise time by 10× shrinks the lumped-circuit budget by 10× on an otherwise unchanged board.

---

## 3. Four Kinds of Reactance

The chapter organizes parasitics into a 2×2: self versus mutual, electric versus magnetic.

| | Electric field | Magnetic field |
|---|---|---|
| **Self** | Ordinary capacitance | Ordinary inductance |
| **Mutual** | Mutual capacitance | Mutual inductance |

---

## 4. Ordinary Capacitance

Arises between any two conducting bodies held at different potentials.

**Reactance at the knee frequency (corrected parenthesization):**

$$X_C = \frac{1}{2\pi F_{knee} C} = \frac{1}{2\pi (0.5/T_r) C} = \frac{T_r}{\pi C}$$

Your note wrote this as `t_r / pi * c`, which reads as $(T_r/\pi) \cdot C$. It is $T_r$ divided by the product $\pi C$.

Worked example: $C = 10$ pF, $T_r = 1$ ns → $X_C = 10^{-9}/(\pi \cdot 10^{-11}) = 31.8\ \Omega$.

**How to use it:** compare $X_C$ to the surrounding circuit impedance. A 10 pF load looking like 32 Ω against a 50 Ω driver is a first-order problem. Against a 10 kΩ node it is irrelevant.

### Capacitance test jig

Pulse generator with a fast edge drives the unknown capacitance through a known source resistance $R_s$; scope observes the node.

- The observed 10–90% rise time is $T_r = 2.2 R_s C$, so $C = T_r/(2.2 R_s)$.
- Subtract instrument contributions in RSS before back-calculating. If the generator and scope contribute comparable rise times to the measurement, the raw number is badly wrong.
- Keep $R_s$ large enough that the RC time constant dominates the generator's own edge, small enough that stray capacitance in the fixture stays negligible.

---

## 5. Ordinary Inductance

Arises wherever current flows in a loop. The current builds a magnetic field, the field stores energy, and that energy cannot be established or removed instantaneously. Inductance is the measure of that reluctance to change.

$$X_L = 2\pi F_{knee} L = \frac{\pi L}{T_r}$$

Worked example: $L = 10$ nH, $T_r = 1$ ns → $X_L = \pi \cdot 10^{-8}/10^{-9} = 31.4\ \Omega$.

Note the symmetry with the capacitance example: at 1 ns edges, 10 pF and 10 nH are equally significant parasitics against a ~50 Ω environment. Useful pair of numbers to memorize.

Inductance is a property of a **current loop**, not of a wire. A "ground pin inductance" figure is meaningless without specifying the return path. This becomes the central theme of later chapters.

### Inductance test jig and the area method (Section 1.6)

Drive a fast step into the inductance in series with a resistor $R$; the scope sees a voltage spike decaying with time constant $\tau = L/R$.

**Better method than eyeballing the decay:** integrate. For an exponential decay of initial amplitude $V_0$,

$$\text{Area} = \int_0^\infty V_0 e^{-t/\tau}\,dt = V_0 \tau \quad \Rightarrow \quad \tau = \frac{\text{Area}}{V_0}$$

and $L = \tau R$.

Why this is the right technique: **a slow generator edge or a bandwidth-limited scope smears the waveform but preserves its area.** Integration is linear and any DC-accurate measuring system has unit area in its impulse response. So the area measurement is immune to exactly the instrument limitations that corrupt a direct time-constant reading. This is the single most useful lab trick in the chapter.

Caveat: it depends on the scope's low-frequency and DC path being accurate. AC coupling destroys the measurement.

---

## 6. Mutual Capacitance

Two circuits, physically adjacent. Voltage in circuit A creates an electric field; that field terminates partly on circuit B and injects current into it. The coupling coefficient is the mutual capacitance $C_m$, in farads.

$$I_m = C_m \frac{dV_A}{dt}$$

For a step of amplitude $\Delta V$ and rise time $T_r$, $dV_A/dt \approx \Delta V / T_r$, so

$$I_m \approx \frac{C_m \Delta V}{T_r}$$

That current develops a voltage across the victim's impedance to ground, $R_B$ (in a jig with both ends terminated, the parallel combination of the two terminations):

$$\text{Crosstalk} = \frac{V_B}{\Delta V} = \frac{C_m R_B}{T_r}$$

Your notes were missing this expression. You had the mutual inductance version but not its capacitive counterpart, and the comparison at the end of the chapter depends on having both.

Coupling falls off rapidly with separation. Doubling trace spacing over a ground plane cuts $C_m$ dramatically, and the presence of a nearby reference plane is what makes the falloff steep.

---

## 7. Mutual Inductance

Two current loops. Current in loop A creates a magnetic field; flux from that field links loop B and induces a voltage. The coefficient is mutual inductance $L_m$, in henries (volt-seconds per amp).

$$V_B = L_m \frac{dI_A}{dt}$$

Your note has `Y = L_m dI_a/dt`. The left side is a voltage, $V$.

With circuit A driven by a step $\Delta V$ through source resistance $R_A$, the current slew rate is $dI_A/dt = \Delta V/(R_A T_r)$, so

$$V_B = \frac{L_m \Delta V}{R_A T_r} \quad \Rightarrow \quad \text{Crosstalk} = \frac{V_B}{\Delta V} = \frac{L_m}{R_A T_r}$$

**Correction:** your note reads `crosstalk = l_m/R_a * t_f`. The rise time is in the **denominator**, not multiplied. Crosstalk gets *worse* as edges get faster, which is the whole point of the chapter. The version as written predicts the opposite.

---

## 8. Which mechanism dominates

Take the ratio of the two crosstalk expressions (using a common impedance $R$ for both):

$$\frac{\text{capacitive}}{\text{inductive}} = \frac{C_m R / T_r}{L_m/(R\,T_r)} = \frac{C_m R^2}{L_m}$$

The $T_r$ cancels. Only impedance decides.

- **Low-impedance circuits** → inductive coupling dominates.
- **High-impedance circuits** → capacitive coupling dominates.

Digital circuits are generally low-impedance: driver output impedances of tens of ohms, transmission lines at 50–100 Ω, large transient currents. So in practice **mutual inductance is usually the worse offender in high-speed digital design**, which is the chapter's closing claim and matches your note.

Two things to carry forward:

- The crossover impedance is roughly $\sqrt{L_m/C_m}$, which is on the order of the characteristic impedance of the coupled structure. This is not a coincidence and gets developed in the transmission line chapters.
- On a PCB with a solid plane and a homogeneous dielectric, the inductive and capacitive contributions to *forward* (far-end) crosstalk tend to cancel, while they add in the *reverse* (near-end) direction. Chapter 1 does not cover this; do not over-apply the simple lumped comparison to long parallel runs.

---

## Summary of formulas

| Quantity | Expression |
|---|---|
| Knee frequency | $F_{knee} = 0.5/T_r$ |
| 3 dB bandwidth | $F_{3dB} = K/T_r$, $K = 0.338$ (Gaussian), $0.350$ (single-pole) |
| Rise-time combination | $T_{tot} = \sqrt{\sum T_i^2}$ |
| Edge length | $l = T_r/D$ |
| Lumped criterion | physical size $< l/6$ |
| Capacitive reactance at $F_{knee}$ | $X_C = T_r/(\pi C)$ |
| Inductive reactance at $F_{knee}$ | $X_L = \pi L/T_r$ |
| RC rise time | $T_r = 2.2 RC$ |
| Exponential decay time constant | $\tau = \text{Area}/V_0$ |
| Mutual capacitance current | $I_m = C_m\,dV_A/dt$ |
| Capacitive crosstalk | $C_m R_B/T_r$ |
| Mutual inductance voltage | $V_B = L_m\,dI_A/dt$ |
| Inductive crosstalk | $L_m/(R_A T_r)$ |
| Dominance ratio (cap/ind) | $C_m R^2/L_m$ |

---

## Errata found in the original notes

1. $X_C$ written as `t_r / pi * c`; correct grouping is $T_r/(\pi C)$.
2. `Y = L_m dI_a/dt` — the induced quantity is a voltage $V$.
3. `crosstalk = l_m/R_a * t_f` — rise time belongs in the denominator: $L_m/(R_A T_r)$.
4. $F_{3dB}$ and $F_{knee}$ were listed adjacently without distinguishing them; they differ by design (0.35 vs 0.5).
5. Mutual capacitance crosstalk expression was absent.
6. The delay table was noted as a placeholder; values filled in above.
7. "Mutual inductance is often worse" is true for digital work but is a consequence of low circuit impedance, not a universal property. Worth stating the condition.