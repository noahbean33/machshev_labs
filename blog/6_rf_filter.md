**PCB RF Filter Design Using Transmission-Line Equivalents**

In microwave and RF printed-circuit-board design, discrete surface-mount inductors and capacitors become impractical above a few gigahertz. Parasitic package inductance, self-resonance, and the physical size of the components relative to wavelength make them unsuitable. Designers therefore synthesize the required reactive elements directly from sections of microstrip or stripline transmission line. The electrical behavior of a short length of line is dual to that of a lumped inductor or capacitor, depending on its characteristic impedance \(Z_0\), electrical length \(\theta = \beta\ell\), and termination (open or short).

### Transmission-Line Transforms for Reactive Elements

The input impedance of a lossless transmission-line stub is classical:

\[
Z_\text{in, short} = j Z_0 \tan\theta, \qquad
Z_\text{in, open} = -j Z_0 \cot\theta.
\]

Consequently the following useful equivalents appear for \(\theta < 90^\circ\):

- **Shunt inductor.** A short-circuited stub presents a purely inductive reactance  
  \[
  X_L = Z_0 \tan\theta.
  \]
  The higher the characteristic impedance and the closer \(\theta\) approaches \(90^\circ\), the larger the inductance.

- **Shunt capacitor.** An open-circuited stub presents a capacitive reactance  
  \[
  X_C = Z_0 \cot\theta.
  \]
  Low-\(Z_0\) (wide) stubs are preferred when large capacitance is required.

- **Series inductor.** A short high-impedance series section (\(\theta < 45^\circ\)) approximates a series inductance  
  \[
  X_L = Z_0 \sin\theta.
  \]
  For electrically short lines \(\sin\theta \approx \theta\) (radians), recovering the familiar \(L = (Z_0/\omega)\theta\).

- **Parasitic shunt capacitance.** Every series microstrip segment also couples to the ground plane beneath it. The same short high-\(Z_0\) section therefore carries an equivalent shunt capacitive reactance  
  \[
  X_C = \frac{Z_0}{\sin\theta}.
  \]
  This parasitic capacitance must be absorbed into the filter prototype or compensated by layout adjustments.

These four relations allow a lumped-element low-pass or high-pass prototype to be mapped onto a purely distributed layout.

### Resonant Sections and Filter Topologies

When the electrical length reaches special fractions of a wavelength, the stubs themselves become resonant tanks:

- A short-circuited quarter-wave line (\(\theta = 90^\circ\)) behaves as a parallel resonant circuit whose equivalent inductance satisfies  
  \[
  Z_0 = \frac{\pi}{4}\omega L.
  \]
- A half-wave open or shorted line acts as a series resonant circuit with reactance slope \(\frac{\pi}{2}Z_0\).

**Low-pass filters** are realized with narrow (high-\(Z_0\)) series segments for the series inductors and wide radial or “bow-tie” open stubs for the shunt capacitors. The radial geometry broadens the capacitive bandwidth and reduces the effect of the open-end fringing fields.

**High-pass filters** invert the topology: series capacitance is introduced by gaps or interdigitated fingers, while shunt inductance is supplied by shorted stubs.

**Band-pass filters** are most commonly built from cascaded quarter-wave coupled-line sections that function as impedance inverters (K-inverters). The coupling coefficient between adjacent resonators is controlled by the gap and the overlapping length. Straight coupled-line geometries consume considerable board length; folding each resonator into a “U” shape produces the compact **hairpin** filter. Hairpin resonators retain the same resonant frequency and coupling rules while occupying roughly half the linear distance of their straight counterparts. Interdigitated finger capacitors or edge-coupled hairpins further tighten the layout when board real-estate is critical.

Because the mapping from prototype element values to physical dimensions involves transcendental equations and mutual coupling, hand calculation rapidly becomes impractical beyond third-order filters. Electromagnetic simulation or dedicated synthesis tools are therefore standard.

### Practical Design Flow and Recommended Tools

1. Start from a classical lumped prototype (Butterworth, Chebyshev, elliptic) scaled to the desired center frequency and impedance.
2. Replace each \(L\) and \(C\) by the appropriate transmission-line equivalent using the transforms above.
3. Optimize line widths, lengths, and gaps in a full-wave simulator to recover the target response, accounting for dispersion, conductor loss, and radiation.
4. Verify sensitivity to etch tolerance and substrate thickness variation.

Useful software and reference sources include:
- Altium Designer’s RF design and impedance calculators,
- QUCS (open-source schematic and filter synthesis),
- RF Café and Microwaves101 online calculators and application notes,
- Brian Wadell’s *Transmission Line Design Handbook* for closed-form microstrip equations and discontinuity models.

### Closing Remarks

Distributed filter design on PCB is fundamentally an exercise in controlled impedance and electrical length. Once the four basic transforms—shorted-stub inductance, open-stub capacitance, series high-\(Z_0\) inductance, and the accompanying parasitic capacitance—are mastered, essentially any classical filter response can be realized without discrete components. Hairpin and interdigitated topologies simply represent space-efficient geometric rearrangements of the same underlying transmission-line elements. With modern layout tools and modest electromagnetic simulation, these structures become routine building blocks for RF front-ends, local-oscillator filtering, and harmonic suppression on multilayer boards.