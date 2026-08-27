**RF and Microwave PCB Couplers: Design Principles and Practical Considerations**

In RF and microwave PCB design, couplers are fundamental passive structures used to split, combine, or sample signals with high efficiency. Unlike discrete components that introduce insertion loss and parasitics, these structures are realized entirely with microstrip or stripline traces over a continuous ground plane. They are nearly lossless when properly designed and require no active semiconductor devices. The three most common printed coupler topologies—90-degree hybrids, rat-race hybrids, and directional (backward-wave) couplers—each exploit controlled electromagnetic coupling and precise electrical lengths to achieve specific amplitude and phase relationships.

### The 90-Degree Hybrid

The 90-degree hybrid (also called a branch-line coupler) is a four-port network constructed from interconnected quarter-wavelength transmission-line segments. A signal applied at port 1 divides equally between ports 2 and 3, with a 90° phase difference between the two outputs. Port 4 is isolated and is normally terminated in a matched 50 Ω load so that any residual energy is absorbed rather than reflected.

In a standard single-section design the branch impedances are not uniform. Two of the lines are set to the system impedance \(Z_0\) (typically 50 Ω) while the remaining two are set to
\[
\frac{Z_0}{\sqrt{2}} \approx 0.707\,Z_0.
\]
This impedance profile produces equal power division and the required quadrature phase shift at the design frequency.

Bandwidth can be extended by cascading additional quarter-wave sections, producing a multi-section “ladder” hybrid. In a two-section realization the middle section is set to \(\sqrt{2}\,Z_0\) while the outer sections use \((1+\sqrt{2})\,Z_0\). The added sections flatten the amplitude and phase response over a wider fractional bandwidth at the cost of increased board area and a more complex impedance schedule.

A frequent system-level use of 90-degree hybrids is power combining for amplifiers. The input signal is split, each path is amplified by a separate, lower-power device, and the amplified signals are recombined by a second hybrid. When the two amplifier paths are well matched, the hybrid recovers nearly the full combined power while preserving good input and output match and improving overall noise performance and VSWR.

### The Rat-Race Coupler

The rat-race (or hybrid-ring) coupler replaces the rectangular branch geometry with a closed annular ring whose circumference is \(1.5\lambda\). The ring is partitioned into one \(3/4\lambda\) arc and three \(1/4\lambda\) arcs. When a signal is injected at one port, equal-amplitude outputs appear at the two adjacent ports with a precise 180° phase difference; the remaining port is isolated.

Because the two outputs are inherently out of phase, the rat-race coupler is an excellent choice for baluns that drive differential antennas or balanced mixers. The structure is relatively tolerant of moderate substrate variations and can be realized on standard FR-4 at lower microwave frequencies, although the large physical size of the ring becomes a practical limitation above a few gigahertz.

### Directional (Backward-Wave) Couplers

Directional couplers rely on distributed electromagnetic coupling between two parallel traces that run side-by-side for a quarter-wavelength. A signal traveling from port 1 to port 2 induces a coupled wave that propagates in the opposite direction and exits at port 4 (the coupled port). Port 3 is the isolated port.

Design begins with a target coupling coefficient \(k\) obtained from the desired coupling in decibels:
\[
k = 10^{-C_{\mathrm{dB}}/20}.
\]
A 6 dB coupler corresponds to \(k \approx 0.5\); a 12 dB coupler yields \(k \approx 0.25\). Once \(k\) is known, the even- and odd-mode impedances of the coupled-line pair are calculated:
\[
Z_{\mathrm{even}} = Z_0\sqrt{\frac{1+k}{1-k}},\qquad
Z_{\mathrm{odd}} = Z_0\sqrt{\frac{1-k}{1+k}}.
\]
These two modal impedances uniquely determine the required trace width and edge-to-edge gap for a given substrate height and dielectric constant.

On ordinary FR-4 the geometry needed for tight coupling quickly becomes impractical. A 6 dB design demands a gap on the order of 0.042 mm—below the reliable resolution of most commercial PCB processes. Relaxing the specification to 12 dB opens the gap to approximately 0.53 mm, a spacing that is readily manufactured.

Even-mode impedance is controlled primarily by the substrate thickness (thinner substrates lower \(Z_{\mathrm{even}}\)), while odd-mode impedance is dominated by the inter-trace gap (smaller gaps lower \(Z_{\mathrm{odd}}\)). Because the two modes experience different effective dielectric constants, the phase velocities are unequal; this dispersion produces a small deviation between the theoretical coupling calculated from the modal impedances and the coupling observed in a full-wave field solver. The discrepancy grows with frequency and is one of the principal reasons that microstrip directional couplers are usually verified and fine-tuned in EM simulation rather than fabricated from closed-form equations alone.

### Design Resources and Practical Notes

A free and continually updated reference for branch-line ratios, bandwidth estimates, and power-division calculations is microwaves101.com. The site’s calculators implement the classic analytic expressions and serve as a convenient starting point before electromagnetic verification.

When selecting a substrate, remember that both the absolute dielectric constant and its uniformity across the board affect electrical length and modal impedance. Higher-frequency designs generally migrate from FR-4 to lower-loss materials (Rogers, Isola, or Taconic laminates) to reduce dispersion and conductor loss. Regardless of material, the final layout should be simulated with a full-wave solver that accounts for the mixed air/dielectric fields of microstrip, finite ground-plane effects, and the actual copper thickness and surface roughness of the chosen process.

By mastering the impedance schedules of the 90-degree hybrid, the ring geometry of the rat-race, and the even-/odd-mode design equations of the directional coupler, an engineer can synthesize compact, high-performance passive networks directly in copper. These printed structures remain among the most efficient and cost-effective tools available for signal distribution and sampling on RF and microwave printed-circuit boards.