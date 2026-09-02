Ben Jordan, Altium OnTrack Whiteboard series (Episode 6, now under Altium Academy), roughly 36 minutes on how RF filters are actually realized in PCB copper. It's a follow-on to Episode 5 (couplers) and leans on Episode 3 (stubs) and Episode 1 (transmission line theory).

## The core idea: line segments as lumped elements

Everything in the episode rests on the stub duality from Episode 3. A quarter-wave shorted stub looks like an open at the center frequency; a quarter-wave open stub looks like a dead short. Below quarter wave, the segments behave as reactances you can design with:

| Structure | Condition | Equivalent | Transform (as spoken) |
|---|---|---|---|
| Shunt stub, shorted to ground | θ < 90° | Shunt L | X_L = ωL = Z₀ tan θ |
| Shunt stub, open circuit | θ < 90° | Shunt C | X_C = 1/ωC = Z₀ cot θ |
| Series line segment | θ < 45° (λ/8) | Series L | X_L = Z₀ sin θ |
| Same segment's coupling to plane | θ < 45° | Shunt C | X_C = Z₀ / sin θ |

He stresses the shunt behavior only exists because there's a ground plane under the trace. Void the plane and the segment isn't a proper transmission line at all: different impedance, capacitance to whatever else is nearby, none of these transforms apply.

For a long trace, he suggests chopping it into λ/8 sections, applying the transform to each, and lumping the results in parallel. That reproduces the series-L/shunt-C ladder model of a transmission line from any textbook, which is the point.

He also gives the resonator transforms (crediting RF Cafe for the chart): quarter-wave shorted stub = parallel resonant tank, Z₀ = (π/4)ωL; quarter-wave open stub = series LC, Z₀ = (4/π)ωL; half-wave segment = series resonant LC with Z₀ = (π/2)-scaled reactance. The auto-transcription mangles some of these ("pi on four," "for on pi"), so the exact algebra in the middle section is worth verifying against the chart rather than the captions.

## Demonstration boards, each with VNA data

- **Bandpass**: series line segments separated by quarter-wave shorted shunt stubs. At DC it's a short to ground, at center frequency the stubs go open and pass, above that they turn inductive again and produce the high-side rolloff.
- **Notch**: a single quarter-wave open stub, very narrow. Broadening it means adding capacitance, which leads to the radial stub, often laid down as a bowtie pair straddling the line instead of one large stub on one side.
- **Low-pass**: thin (therefore inductive) trace segments in series alternating with groups of radial stubs acting as large shunt capacitors. Classic series-L/shunt-C ladder.

## Filter type synthesis

High-pass comes from series capacitance (two coupled conductors are naturally a high-pass element) plus shunt inductance to ground. Bandpass combines series and parallel L and C, with reactances chosen at corner frequencies F1 and F2, and damping chosen for the passband ripple you're willing to accept. He name-checks Chebyshev, Bessel, Butterworth, and elliptic responses but explicitly declines to teach the synthesis math.

## Getting series capacitance in copper

Two methods: a gap in the transmission line (works, somewhat lossy), or an interdigitated capacitor with many coupled fingers, which raises coupling and lowers loss. He cites Wadell's *Transmission Line Design Handbook* for the closed-form equations and notes it's hard to find a copy.

## Coupled-line and hairpin filters

Pulling forward the directional coupler from Episode 5: two lines running parallel for a quarter wavelength couple both capacitively and magnetically, and are fairly broadband. Cascade those coupled sections end to end and each resonator (effectively half-wave, built as adjoining quarter-wave coupled strips) resonates at the passband center. That's the standard coupled-line bandpass.

His demo board is exactly this, laid out as a long line canted at a slight angle so it runs connector to connector. He compares the VNA sweep against the synthesis tool's predicted response and gives a shout-out to Sierra Circuits ("Amit") for turning the boards in eight hours for an RF class he was teaching.

Fold each coupled section back on itself, leaving enough line that it doesn't couple to itself, and you get the hairpin filter. Same circuit, concertina'd into less board area, with the input line typically feeding the first hairpin directly. More sections means steeper skirts, same tradeoff as any passive ladder.

## Tooling and resources

No convenient closed form exists for these structures. Piecewise L/C decomposition gets you decent results but the coupling factors make it tedious, so in practice you use software. He uses Qucs (transcribed as "Kooks") for filter synthesis, which outputs the required segment lengths, then builds the coupled-line segments as Altium components so they can be represented on a schematic. For optimization he recommends a proper field solver. Resource pointers: microwaves101.com, RF Cafe, free calculators from semiconductor vendors, and he mentions a ham operator selling a purpose-built program for around $200. He floats writing an Altium Designer script to automate the numerical work as a good project for someone ambitious.

He closes by framing the whole thing as qualitative intuition rather than a design course, and teases antennas as a future topic.