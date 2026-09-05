Chapter 2 is "High-Speed Properties of Logic Gates." 

**Framing**

The chapter's thesis is that a logic family's datasheet headline numbers (propagation delay, static power) are not what determine whether a design works at speed. What matters is the output rise time, the transient current the gate demands, and the parasitics of the package it sits in. Everything else in the chapter follows from those three.

**Power**

Johnson breaks gate power into pieces so you can see which ones scale with frequency:

- Static/quiescent dissipation, which dominates in bipolar families (TTL, ECL) and is essentially leakage in CMOS.
- Dissipation charging and discharging load capacitance. Each full cycle moves CV of charge from rail to ground, giving CV²f, half burned in the pull-up path and half in the pull-down path. This is independent of the driver's output resistance, which surprises people.
- Shoot-through (overlap) current during transitions, when both halves of a totem-pole output conduct simultaneously. This scales with edge rate and frequency.
- Input power, which for CMOS is dominated by the capacitance the previous stage has to drive.

The important consequence is not the thermal number. It's that the current is transient and spiky, which is what makes power distribution and bypassing a high-speed problem rather than a DC problem.

**Speed**

Propagation delay and rise time are separate specifications, and rise time is the one that sets the bandwidth of what you're routing. A slow-clocked board built with fast parts still has fast-edge signals and behaves like a high-speed design.

Related points:
- Input capacitance loads the driver. Driver output impedance times accumulated load capacitance sets an RC that degrades the edge, so fanout at high speed shows up as slower edges rather than as a DC level problem.
- Manufacturers spec typical or maximum delays but rarely bound the minimum rise time, and the fast corner is what causes ringing, crosstalk, and ground bounce. Design against the fastest parts you might receive, not the typical ones.
- Substituting a nominally pin-compatible faster family into a working slow design is a classic way to break it, because the edges get faster even though the clock doesn't.

**Output impedance and drive**

Gate output impedance is nonlinear and asymmetric between the high and low states. That asymmetry is why source termination is imperfect and why current-sourcing and current-sinking capability need to be looked at separately when you're driving a transmission line.

**Packaging**

This is the part of the chapter most people remember. Package leads have series inductance and mutual inductance to neighboring leads, and at fast edge rates that inductance dominates the pin's behavior.

- Ground bounce: switching current flowing through the shared ground lead inductance develops L·di/dt across it, offsetting the die's internal ground from board ground. Quiet outputs on the same package move, and inputs referenced to board ground see corrupted levels. It scales with the number of simultaneously switching outputs and with edge rate.
- The same mechanism on the power lead produces supply droop internal to the package.
- Package capacitance adds to the effective input load.
- Shorter leads are the fix, which is the argument for surface-mount over DIP and for multiple ground pins distributed across the package.
- Thermal resistance from junction to case to ambient is covered as the other half of why packaging choice matters.

**Noise budget**

The chapter closes the loop by pointing out that DC noise margin is a budget, and high-speed effects (reflections, crosstalk, ground bounce, supply noise) all draw against the same account. A part with generous static noise margin can still fail if those transient contributions add up.

