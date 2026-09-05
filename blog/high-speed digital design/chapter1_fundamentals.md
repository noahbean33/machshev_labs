# High-Speed Digital Design (Johnson & Graham) — Chapter 1: Fundamentals

Lecture notes, cleaned up. Formulas corrected, the delay table filled in, and the crosstalk
comparison completed. Worked numerically in the companion notebook,
`chapter1_fundamentals.ipynb`.

---

## 0. What "high speed" means

A circuit is high speed when the **rise time is short compared to the propagation delay through the
interconnect**. Clock frequency is not the criterion. A 1 MHz clock built from a 200 ps logic family
is a high-speed design problem; a 100 MHz clock with 5 ns edges over short traces may not be.

Everything in the chapter follows from this: the relevant frequency content is set by the *edge*, not
the *repetition rate*.

---

## 1. Frequency, time, and distance

### Knee frequency

$$F_{knee} = \frac{0.5}{T_r}$$

$T_r$ is the **10–90% rise time** of the fastest edge in the system. $F_{knee}$ is the frequency
below which most of the energy in a digital pulse is concentrated.

Four claims, and they are what the rest of the chapter rests on:

- Response at **high** frequencies governs a circuit's processing of **short**-timescale events
  (edges, reflections, ringing).
- Response at **low** frequencies governs **long**-timescale events (droop, baseline wander, DC
  offset).
- Behaviour **at** $F_{knee}$ determines how a circuit processes a step edge.
- Behaviour **above** $F_{knee}$ hardly affects digital performance.

### 3 dB bandwidth is a different number

$$F_{3dB} = \frac{K}{T_r} \qquad K = 0.338 \ \text{(Gaussian)}, \quad 0.350 \ \text{(single-pole exponential)}$$

Practical value $F_{3dB} \approx 0.35/T_r$. **Keep this separate from $F_{knee}$.** $F_{3dB}$ is a
measured, physically defined quantity; $F_{knee} = 0.5/T_r$ is a deliberately conservative heuristic
sitting ~43% above it, so that a circuit judged acceptable at $F_{knee}$ has margin. Use $F_{3dB}$ in
a filter calculation, $F_{knee}$ to decide what matters.

Cascaded stages combine in root-sum-square, which the test jigs below depend on:

$$T_{measured} \approx \sqrt{T_{signal}^2 + T_{scope}^2 + T_{gen}^2}$$

### Propagation delay

Speed of light is 11.8 in/ns, so $D = 85\sqrt{\varepsilon_r}$ ps/in. (The constants file gives
84.723 ps/in exactly.)

| Medium | Delay (ps/in) |
|---|---|
| Air / free space | 85 |
| Coax, 75% velocity factor | 113 |
| Coax, 66% velocity factor | 129 |
| FR-4 outer layer (microstrip) | 140–180 |
| FR-4 inner layer (stripline) | ~180 |
| Alumina inner layer | 240–270 |

Stripline follows from $\varepsilon_r \approx 4.5$; alumina at $\varepsilon_r \approx 10$ gives
$85\sqrt{10} \approx 270$. Microstrip is faster and quoted as a range because part of its field
returns through air, so the effective dielectric constant drops below the bulk value by an amount
that depends on trace geometry.

### Length of the rising edge

$$l = \frac{T_r}{D}$$

$T_r$ in ps, $D$ in ps/in, $l$ in inches. This is the physical distance the leading edge occupies
while it is in transition.

Example: a 1 ns edge on FR-4 stripline → $l = 1000/180 = 5.6$ in.

---

## 2. Lumped versus distributed

**A circuit is lumped if its physical extent is less than $l/6$.**

Continuing the example, a 1 ns edge on stripline gives a threshold of about 0.93 in.

- **Lumped**: ordinary circuit theory applies. Voltage is the same everywhere on a node at any
  instant. KVL/KCL, no wave propagation, no characteristic impedance, no termination required.
- **Distributed**: the signal is a travelling wave, voltage differs along the conductor, and you need
  transmission line analysis, characteristic impedance and a termination strategy.

The 1/6 is a convention — some use 1/4, some 1/10. Nothing physical happens at the boundary; the
error in the lumped approximation grows continuously.

**The threshold scales with $T_r$, not with clock period.** Shrink rise time 10× and the
lumped-circuit budget shrinks 10× on an otherwise unchanged board.

---

## 3. Four kinds of reactance

| | Electric field | Magnetic field |
|---|---|---|
| **Self** | Ordinary capacitance | Ordinary inductance |
| **Mutual** | Mutual capacitance | Mutual inductance |

$T_r$ ends up in the denominator of every consequence below. **Faster edges make all four worse.**

---

## 4. Ordinary capacitance

Arises between two conducting bodies charged to different potentials.

$$X_C = \frac{1}{2\pi F_{knee} C} = \frac{T_r}{\pi C}$$

$T_r$ divided by the product $\pi C$ — see correction 1.

Example: $C = 10$ pF, $T_r = 1$ ns → $X_C = 31.8\ \Omega$.

**How to use it:** compare $X_C$ to the surrounding circuit impedance. 32 Ω against a 50 Ω driver is a
first-order problem and belongs in the model. Against a 10 kΩ node it is irrelevant.

### Capacitance test jig

Easy to build from a pulse source and a scope. The generator drives the unknown capacitance through a
known source resistance $R_s$; the scope watches the node.

- Observed 10–90% rise time is $T_r = 2.2 R_s C$, so $C = T_r/(2.2 R_s)$.
- **Subtract the instrument contributions in RSS first.** If the generator and scope contribute
  comparable rise times, the raw number is badly wrong.
- Keep $R_s$ large enough that the RC dominates the generator's own edge, small enough that fixture
  stray capacitance stays negligible.

---

## 5. Ordinary inductance

Arises wherever current flows in a loop. The current builds a magnetic field, the field stores energy,
and that energy takes finite time to establish or remove. Inductance measures that reluctance to
change.

$$X_L = 2\pi F_{knee} L = \frac{\pi L}{T_r}$$

Example: $L = 10$ nH, $T_r = 1$ ns → $X_L = 31.4\ \Omega$.

Note the symmetry with the capacitance example: **at 1 ns edges, 10 pF and 10 nH are equally
significant against a ~50 Ω environment.** Worth memorising.

Inductance is a property of a **current loop**, not of a wire — a "ground pin inductance" figure is
meaningless without specifying the return path. This becomes the central theme of later chapters.

### Inductance test jig and the area method

Drive a fast step into the inductance in series with a resistor $R$; the scope sees a spike decaying
with $\tau = L/R$.

Rather than eyeballing the decay, **integrate**:

$$\text{Area} = \int_0^\infty V_0 e^{-t/\tau}\,dt = V_0\tau \quad\Rightarrow\quad \tau = \frac{\text{Area}}{V_0}, \qquad L = \tau R$$

Why this is the right technique: **a slow generator edge or a bandwidth-limited scope smears the
waveform but preserves its area.** Integration is linear, and any DC-accurate measuring system has
unit area in its impulse response — so the area measurement is immune to exactly the instrument
limitations that corrupt a direct time-constant reading. The most useful lab trick in the chapter.

Caveat: it depends on the scope's low-frequency and DC path. **AC coupling destroys the
measurement.**

---

## 6. Mutual capacitance

Two adjacent circuits. Voltage in circuit A creates an electric field; that field terminates partly on
circuit B and injects current into it. The coefficient is mutual capacitance $C_m$, in farads, and it
decays rapidly with increasing separation.

$$I_m = C_m\frac{dV_A}{dt} \approx \frac{C_m \Delta V}{T_r}$$

That current develops a voltage across the victim's impedance to ground, $R_B$ (in a jig with both
ends terminated, the parallel combination of the two terminations):

$$\text{Crosstalk} = \frac{V_B}{\Delta V} = \frac{C_m R_B}{T_r}$$

This expression was missing from the notes, and the comparison in §8 needs it — see correction 5.

---

## 7. Mutual inductance

Two loops of current. Current in loop A creates a magnetic field whose flux links loop B and induces a
voltage. The coefficient is mutual inductance $L_m$, in henries (volt-seconds per amp), and it also
decays rapidly with distance.

$$V_B = L_m\frac{dI_A}{dt}$$

The induced quantity is a **voltage** — see correction 2.

With A driven by a step $\Delta V$ through source resistance $R_A$, the current slew rate is
$\Delta V/(R_A T_r)$, so

$$\text{Crosstalk} = \frac{V_B}{\Delta V} = \frac{L_m}{R_A T_r}$$

**Rise time is in the denominator** — see correction 3.

---

## 8. Crosstalk: which mechanism dominates

Take the ratio of the two crosstalk expressions, using a common impedance $R$:

$$\frac{\text{capacitive}}{\text{inductive}} = \frac{C_m R / T_r}{L_m/(R\,T_r)} = \frac{C_m R^2}{L_m}$$

**The $T_r$ cancels. Only impedance decides.**

- **Low-impedance circuits** → inductive coupling dominates.
- **High-impedance circuits** → capacitive coupling dominates.

Digital circuits are generally low-impedance: driver outputs of tens of ohms, lines at 50–100 Ω, large
transient currents. So **among high-speed digital circuits, mutual inductance is often a worse problem
than mutual capacitance** — the chapter's closing claim.

Two things to carry forward:

- The crossover impedance is $\sqrt{L_m/C_m}$, which is on the order of the characteristic impedance
  of the coupled structure. Not a coincidence; developed in the transmission line chapters.
- On a solid plane in a homogeneous dielectric, the inductive and capacitive contributions to
  *forward* (far-end) crosstalk tend to cancel, while they add in the *reverse* (near-end) direction.
  Chapter 1 does not cover this. Do not over-apply the simple lumped comparison to long parallel runs.

---

## Summary of formulas

| Quantity | Expression |
|---|---|
| Knee frequency | $F_{knee} = 0.5/T_r$ |
| 3 dB bandwidth | $F_{3dB} = K/T_r$, $K = 0.338$ (Gaussian), $0.350$ (single-pole) |
| Rise-time combination | $T_{tot} = \sqrt{\sum_i T_i^2}$ |
| Propagation delay | $D = 85\sqrt{\varepsilon_r}$ ps/in |
| Edge length | $l = T_r/D$ |
| Lumped criterion | physical size $< l/6$ |
| Capacitive reactance at $F_{knee}$ | $X_C = T_r/(\pi C)$ |
| Inductive reactance at $F_{knee}$ | $X_L = \pi L/T_r$ |
| RC rise time | $T_r = 2.2RC$ |
| Decay time constant | $\tau = \text{Area}/V_0$ |
| Mutual capacitance current | $I_m = C_m\,dV_A/dt$ |
| Capacitive crosstalk | $C_m R_B/T_r$ |
| Mutual inductance voltage | $V_B = L_m\,dI_A/dt$ |
| Inductive crosstalk | $L_m/(R_A T_r)$ |
| Dominance ratio (cap/ind) | $C_m R^2/L_m$ |

---

## Corrections to the original notes

1. $X_C$ written as `t_r / pi * c`, which reads as $(T_r/\pi)\cdot C$. Correct grouping is
   $T_r/(\pi C)$.
2. `Y = L_m dI_a/dt` — the induced quantity is a voltage, $V$.
3. `crosstalk = l_m/R_a * t_f` — rise time belongs in the **denominator**: $L_m/(R_A T_r)$. As
   written it predicts that crosstalk improves as edges get faster, which inverts the thesis of the
   chapter.
4. $F_{3dB}$ and $F_{knee}$ were listed adjacently without distinguishing them. They differ by design
   (0.35 vs 0.5).
5. The mutual capacitance crosstalk expression was absent. §8 depends on having both.
6. The delay table was a placeholder; values filled in above.
7. "Mutual inductance is often worse" is true for digital work, but it is a consequence of low circuit
   impedance, not a universal property. Worth stating the condition.
