# High-Speed Digital Design: A Compiled Lecture

*Synthesized from the Altium Academy high-speed design series presented by Lee Ritchey (Speeding Edge). Reorganized into dependency order and written up as a single continuous lecture. Source videos are listed at the end.*

---

## 0. What this lecture covers

Ten short talks, one argument. The argument is this: every board you design is a high-speed board whether you wanted it to be or not, because the parts you buy have fast edges. Once that is true, five things can wreck a signal on its way from driver to receiver, and each of them is a solvable engineering problem with a tool, a number, and a rule you load into the layout software. The five, roughly in the order the industry ran into them historically:

1. Reflections from impedance discontinuities
2. Crosstalk between adjacent traces
3. Ripple on the power delivery system, which also happens to be the dominant source of EMI
4. Timing skew across parallel buses
5. Loss and glass-weave-induced skew, which show up when you go past about 5 to 10 Gb/s

Signal integrity engineering is the practice of guaranteeing that every logic signal arrives at its receiver with enough quality that the circuit works every time. That is the whole definition. Everything below is mechanism and method.

---

## 1. What makes a design "high speed"

The instinct is to look at clock frequency. That instinct will get you a failed product, because clock frequency is not what causes signal integrity problems. Switching edges are. The events that create reflections and crosstalk are the 0-to-1 and 1-to-0 transitions, and the rise and fall times of those transitions are set by the silicon process of the part you bought, not by how fast you chose to clock it.

### The story that makes the point

A client built a pulse oximeter, the clip that goes on your finger in a hospital and reports pulse rate and blood oxygen. Board clock frequency: 1 MHz. Nobody would call that fast. One day factory yield went from 100% to zero. The cause was a memory manufacturer substituting a newer part. The old part had edges of five or six nanoseconds. The new part had edges of 100 picoseconds. The board had never been designed for that rise time, and the product had to be redesigned. Same schematic, same clock, same layout, different edge rate, dead product.

That is the reason the "is my design high speed?" question has to be answered with edge rate.

### The time-to-distance conversion

The single most useful number in this whole field:

> **A signal travels about 6 inches (15 cm) per nanosecond in a printed circuit board.**

Everything else is arithmetic on that.

| Edge rate | Physical length of the edge | Half that length |
|---|---|---|
| 1 ns | 6 in / 15 cm | 3 in |
| 0.5 ns | 3 in / 7.5 cm | 1.5 in |
| 100 ps | 0.6 in / ~1.5 cm | 0.3 in |
| 50 ps | 0.3 in | 0.15 in |

### The critical length rule

When a trace gets longer than **half the rise time expressed as distance**, you have to treat it as a transmission line: controlled impedance, and a termination strategy.

Modern logic runs 100 ps edges. That puts the threshold at 0.3 inches. The newest memory parts have 50 ps edges, which puts it at 0.15 inches. There is essentially nothing on a modern board shorter than that.

The conclusion is unavoidable and it is the thesis of the entire series: **everyone is in the high-speed business now**, regardless of clock rate, because of what the parts do.

Crosstalk arrives at about half that length again. Backward crosstalk reaches its maximum at roughly a quarter of a rise-time length of parallel run. So on a 100 ps board, that is about 0.15 inches. You are not going to route a board where traces run parallel for less than 0.15 inches, which has consequences we will get to in Section 5.

---

## 2. Transmission lines and impedance

### The equivalent circuit

Every trace is a transmission line, even when people call it a wire. The model is a distributed ladder network: series **R** (copper resistance) and series **L** (inductance along the length, which exists whether you like it or not), with **C** hanging from each node down to the reference plane.

The reactances tell you when this matters:

- X_C = 1 / (2πfC). At f = 0, X_C is infinite, so at DC the capacitance does nothing.
- X_L = 2πfL. At f = 0, X_L is zero, so at DC the inductance does nothing.

At DC you only see the R of the copper, which is why low-speed design ignored all of this. As soon as frequency leaves zero, both reactances quickly become much larger than R and they, not the copper resistance, determine how the line behaves.

### What impedance actually is

Transmission line impedance is the resistance to the flow of energy down the line.

> **Z₀ = √(L₀ / C₀)**

Large C gives low impedance. Small C gives high impedance.

The useful engineering fact is that **L₀ is not much of a variable**. It runs around 3.5 nH per inch of length more or less regardless of the structure. So when you are targeting an impedance, you are manipulating **C₀**, and you have exactly two knobs for that:

1. **Height above the nearest plane**
2. **Trace width**

You find L₀ and C₀ with a **2D field solver**, and the solver needs an accurate real dielectric constant for the laminate you are actually using. This is a recurring theme: the field solver output is only as good as the material data you feed it.

### Structures you will encounter

- **Microstrip**: trace on an outer layer, one plane beneath it
- **Stripline**: trace buried in the middle, plane above and plane below
- **Coax**: center conductor and surrounding shield, impedance between the two
- **Twisted pair**: impedance between the two members of the pair (this is wired Ethernet)

---

## 3. Reflections

### Where the energy goes

Drive a transmission line and you send energy down it as an electromagnetic field. Change the impedance anywhere along the path, or at the end, and part of that energy reflects back toward the source instead of arriving at the load. The signal at the load is diminished by exactly that much.

### The reflection coefficient

> **Γ = (Z_L − Z₀) / (Z_L + Z₀)**

where Z₀ is the impedance upstream of the change and Z_L is the impedance downstream of it.

- **Z_L > Z₀** gives a **positive** reflection. It travels in the same direction as the incident waveform and adds to it. This is **overshoot**.
- **Z_L < Z₀** gives a **negative** reflection. It subtracts. This is **undershoot**.
- **Z_L = Z₀** gives no reflection at all. All the energy is absorbed by the network.

### Which one you should be afraid of has changed

With 5 V logic, overshoot was the enemy. It was not hard to generate enough overshoot to violate the input voltage rating of a part and cause a failure. Undershoot nobody cared about, because there was so much noise margin that a little subtraction did not matter.

Modern logic inverts this. Signal swings of 1 volt are common. Noise margin is small, and it is now quite difficult to generate enough overshoot to violate an input rating. **Undershoot is the modern problem.** If you are going to miss your termination value, missing high is the safer direction.

### Where discontinuities come from

- **Trace width changes within a layer.** The old practice of "necking down" to squeeze a trace through a pin field has to stop. That neck is an impedance change.
- **Layer changes where the two layers are not the same impedance.** This is almost certainly the origin of the folklore that vias cause reflections. The reflection is from the impedance mismatch between the two layers, not from the via.
- **Connectors.** Most connectors are not 50 ohms, and most of what you design on a board is.
- **Clustered loads.** A pile of loads in one place is a pile of C in one place, and by Z₀ = √(L/C) that local spot has lower impedance. Distribute loads, do not cluster them.

### A myth worth killing

**Right-angle bends do not cause reflections.** That belief traces back to an error in a Motorola design guide published in 1974 and has been propagating ever since.

---

## 4. Terminations

Two ways to kill the reflection off the end of a line.

### Series termination (at the driver)

Put a resistor at the driver output such that driver output impedance plus resistor equals Z₀. This is the dominant method in CMOS.

The mechanism is worth understanding because it is a case where the reflection is the point. At t = 0 the driver switches, and the source resistance and line impedance form a divider, so what launches down the line is **V/2**. That half-amplitude wave charges the parasitic capacitance as it travels. It reaches the far end, which is an open circuit (a CMOS input), and reflects completely. On the return trip it charges C the rest of the way to V. When that reflected wave arrives back at the driver, the voltage is the same everywhere along the path, current goes to zero, and you have a stable charged line.

This is **reflected wave switching**, and it is how the PCI bus works. The reflection is doing useful work.

### Parallel termination (at the receiver)

A resistor to a reference at the far end, matched to Z₀. This absorbs the energy so nothing comes back.

Parallel termination burns significant DC power, which is why there is very little of it left in single-ended CMOS. Where you still find it:

- The data lines of DDR
- The ends of every differential pair (and here it is inside the receiver, so the designer never sees it)

---

## 5. Crosstalk

### The two flavors

An active line (aggressor) couples energy into an adjacent quiet line (victim). What you observe depends on which end of the victim you look at.

- **NEXT (near-end / backward crosstalk)**: measured at the victim's end nearest the aggressor's driver
- **FEXT (far-end / forward crosstalk)**: measured at the far end

They behave completely differently as you extend the parallel run length:

**Forward crosstalk** grows gradually but keeps growing without bound. Run two lines parallel long enough and the signal appears equally in both receivers. This is what plagued the phone company's multi-pair cables, and it is why you could sometimes faintly hear someone else's conversation.

**Backward crosstalk** grows much faster but **saturates**. Past a certain parallel length, running further alongside adds no more crosstalk. RF engineers exploit this saturation deliberately to build directional couplers, sampling the backward port of a victim line to measure power in the driven line. In digital there is no such use. Crosstalk is always negative.

On printed circuit boards, backward crosstalk is essentially the only one you have to worry about, and you get into trouble with it long before forward crosstalk becomes an issue.

### Why "limit the parallel run length" is not a real rule

Layout tools, Altium's included, will let you set a maximum parallel run length. The implicit assumption in that rule is that you will stop running side by side while you are still partway up the backward crosstalk curve, before saturation.

Run the numbers. For a 100 ps edge, the critical length where backward crosstalk saturates is about **half an inch**. How many boards can you route where no two traces run parallel for more than half an inch? Approximately none.

So the parallel-run-length constraint does not work as a crosstalk control mechanism on real boards. You are going to exceed it everywhere.

### What actually works

Once you accept that you will exceed critical length, the saturation property becomes a gift: **length stops mattering**. Beyond critical length, continuing to run side by side does not make crosstalk worse. That leaves exactly two variables:

1. **Height above the nearest plane (H)**
2. **Edge-to-edge separation (S)**

The method is:

1. Determine how much crosstalk the victim's logic family can tolerate.
2. Propose a geometry (H and S).
3. Calculate the resulting crosstalk with a 2D or 3D field solver.
4. Almost always discover it is worse than you assumed.
5. Increase S, reduce H, or both, and iterate until you meet budget.
6. Load the resulting spacing rules into the route control files so the constraint is enforced whether you hand route or autoroute.

Step 3 through 5 is roughly a five-minute exercise with a tool like HyperLynx. Follow this method and you never have a crosstalk problem, and you never have to think about parallel run length again.

### The guard trace does not do what you think

A common instinct is to insert a grounded trace between the aggressor and victim and expect the crosstalk to go away.

Work the example. A very common routing geometry is 5 mil line, 5 mil space, 5 mil height. That configuration produces roughly **8% crosstalk**. Say you dislike that number and add a guard trace. To insert one you need a 5 mil trace plus another 5 mil space, so your separation S goes from 5 mils to **15 mils**. Crosstalk drops to about **0.8%**.

It worked. But the guard trace did not do it. **The mechanical separation did it.** You would have gotten the same result by just moving the traces 15 mils apart and putting nothing between them.

Worse, the guard trace can hurt you. Microwave bandpass filters are built by placing traces side by side precisely because of the coupling. Adding a trace into a coupled region runs a real risk of increasing crosstalk rather than reducing it, and it makes the layout harder. Guard traces and parallel-run-length limits are both the wrong answer.

### The objection, and the answer

Designers will say: if I have to separate traces by that much, I will never fit all the traces on the routing layer.

That is probably true. It may force you onto more layers. The alternative you are proposing is that you have found a method of suspending the laws of physics on an occasional basis.

The relevant Einstein line, which he reportedly used on graduate students looking for shortcuts: everything should be as simple as possible, and no simpler. The geometry-based crosstalk method is as simple as this problem gets.

---

## 6. Length matching on parallel buses

### What a bus is and why it is wide

A bus is a set of data or address signals that travel together. VME, PCI, CPU data lines, memory data and memory address. The original PC microprocessor had 8-bit data and address. Then 16, then 32, and current PCs are mostly 64 bits wide. The motivation for width is straightforward: more work per clock cycle.

### What length matching is for

Take a data word from logic block A, send it to logic block B, and clock it into a register or into memory. You need every bit to be settled and valid at the instant the clock edge arrives. So you have two matching jobs:

1. Match the data bits to each other, so they all arrive together.
2. Position the clock relative to the data, so the clock edge lands in the middle of the valid window.

### Doing the arithmetic

The right way to derive a length matching spec is to convert time to distance with the 6 inches per nanosecond ruler.

Worked example: a bus running at 1 Gb/s has a bit period of 1 ns, which is 1000 ps, which is 6 inches. To center the clock in the bit period you want to delay it by half a bit period, 500 ps, which is **3 inches**.

Take whatever your actual data rate is, get the bit period, and work out how much skew you can tolerate as a fraction of it. Manufacturers will often give you a length matching spec in the datasheet.

### Be suspicious of round numbers

When you see a length matching spec that reads "100 picoseconds" or some similarly round figure, it is very likely made up rather than derived. Do the math yourself.

The recurring finding is that **length matching requirements imposed on most buses are unnecessarily strict**. People work far harder matching lengths than the timing budget requires, because nobody did the arithmetic.

---

## 7. Differential pairs and the move from parallel to serial

### Why they exist

The origin is ECL-era computing, where the logic sat in several large boxes scattered around a computer room and the ground between boxes was not good enough for single-ended signaling. Differential circuits tolerate a large ground offset between the two ends. That was the original motivation, and differential remains the most robust way there is to connect two circuits together.

So why not do it for everything from the beginning? Because you need a **SerDes**, a serializer/deserializer, to turn a parallel bus into a serial bit stream and back again at the far end. That block used to be very expensive, so you only paid for it when a ground offset problem forced you to. Wired Ethernet between two buildings had the same problem and the same expensive answer, in the form of a modem.

With ICs carrying billions of transistors, SerDes are effectively free. Given the choice today you always take the serial link.

### The two benefits

**Far fewer wires.** PCI to PCI Express went from 137 lines to 4 differential pairs. That is a dramatic reduction in wire count and in the number of things whose length you have to match.

**Immunity to external noise.** With the two conductors side by side, noise coupling in from outside lands on both and does not degrade the difference.

### The reason they go so fast

This is the part that matters most. Single-ended logic decides a logic state against a threshold, so timing accuracy depends on how sharp the edge is. Send a square wave far enough down a lossy path and the edge degrades into something rounded, and you start getting errors.

Differential signaling decides the logic state at **the crossing point of the two waveforms**. Edge sharpness stops mattering. All you have to deliver to the far end is a sine-like waveform that resembles the data.

That is what allows 56 Gb/s differential pairs in copper on a board today. The clock is 28 GHz, which everyone will tell you is microwave, but it is digital, and it is only possible because of differential signaling.

Put plainly: without differential pairs there would be no internet, because you cannot run data at these rates on parallel buses.

### What the designer actually has to do

Remarkably little. There are two requirements:

1. **The two members of the pair must be the same length**, within the specified tolerance.
2. **Neither member may be interfered with by crosstalk from outside.**

That is the list. All the terminators are parallel and they live inside the receiver, so there is nothing to place. And modern protocols embed the clock in the data, so there is no clock-to-data matching to do either.

It is genuinely difficult to get a differential design wrong. The only two ways are mismatched length and letting crosstalk in. Anyone who lived through the PCI to PCI Express conversion will tell you a good thing happened to the layout job.

---

## 8. Stackup design

### What a stackup is

An arrangement of copper layers (signal, power, ground) separated by sheets of woven glass impregnated with resin, arranged to satisfy a whole set of simultaneous goals.

In the early years, copper layers held low-speed signals plus power and ground routed as traces. Edges were around 20 ns, which by modern standards is glacial, and nothing special was needed to deliver power. As complexity and power consumption grew, you needed more layers for wiring and more layers for power distribution. Current practice might be six or eight signal layers and as many or more power and ground layers. An 18-layer board split roughly half and half is unremarkable.

### Everything a modern stackup has to deliver

1. **Constant impedance for all signals**, to minimize reflections. This is where everyone starts.
2. **Crosstalk control**, through the height-above-plane half of the H/S pair.
3. **Multiple supply voltages.** A recent design had 29 rails on one board. The iPhone has 22 rails, in something that small. You need enough copper in enough planes to handle the voltage drop from each rail's current.
4. **Interplane capacitance.** Discrete bypass capacitors are too slow to support modern edges, so you build plane capacitors into power/ground plane pairs. More on this below.
5. **Glass weave control**, to prevent differential skew above roughly 5 to 6 Gb/s.
6. **Thickness and cost targets.** Trading these against everything above is frequently the hardest part of the job.

### Why the fabricator cannot do your stackup

For a long time, most companies handed the stackup to the fab shop and asked them to calculate impedance. It was never the right thing to do, but it worked while impedance was the only concern.

**Every item on that list except impedance is outside the fab shop's skill set.** It has to be owned by the board designer, the SI engineer, and the circuit designer.

The crosstalk case makes this concrete. Your two crosstalk variables are height above plane and edge-to-edge separation. If you hand the stackup to the fabricator, the thing they are most likely to adjust to make their process work is **height above the nearest plane**. They have no visibility into your separation, and no reason to know you were trading the two against each other. Your crosstalk budget quietly changes.

### The ordering constraint that surprises people

**You cannot do the stackup until after you have done the power delivery design.**

The reason is interplane capacitance. Until you know how much each rail needs, you do not know how many plane pairs the stackup requires. So PDS design comes first, and the stackup is built to serve it.

### What has to be on the stackup drawing

The minimum information the fabricator needs is more than most people put down:

- Layer order and function
- Copper weights
- **The specific glass weave style** for each dielectric
- Resin content
- Dielectric thickness for each layer
- Trace width specification
- Target impedances
- The plane pairs that form interplane capacitors, with their separation called out explicitly (3 mils is a typical value)

That level of detail used to startle people. Good fabricators worldwide are used to it now and are not surprised by it.

### Sanity check on effort

A recent terabit router, pizza-box sized, every signal differential at 10 Gb/s, 29 rails, six plane pairs to distribute them: developing the SI routing rules took about **three days**. Getting the power delivery right took nearly **a month**.

Power delivery is now harder than all the rest of it. Budget accordingly.

---

## 9. Power delivery and EMI

These are one topic, not two.

### The failure mode

A poorly designed power delivery system (PDS) shows one primary symptom: **excessive ripple on VDD**, caused by supply voltage sagging in response to load current changes.

That ripple hurts you in two distinct ways:

1. It couples onto logic signals and eats noise margin, causing failures. This is a common problem on DDR.
2. It escapes the product and becomes EMI.

### The bypass capacitor rule that has been wrong for thirty years

For at least thirty years, the frequencies present in switching edges have been too high for the discrete bypass capacitors people put on boards. The classic "0.1 µF and 0.01 µF at every part" rule comes from app notes that have not been revised in decades, and following it will reliably give you a bad PDS.

The Achilles heel of all high-speed power delivery is **inductance in the power path**. A mounted discrete capacitor has inductance in its package and its mounting structure that makes it useless at the frequencies of a 100 ps edge.

### Interplane capacitance

The answer is to build the capacitor into the stackup: two power/ground planes placed close together (3 mils is typical) form a plane capacitor. Its inductance is roughly **two orders of magnitude lower** than a mounted discrete capacitor. That is why it can supply the high-frequency charge that fast switching edges demand, and the mounted capacitor cannot.

### EMI is not mysterious

EMI was for years the number one reason products were late to market. Everything else worked, and the product failed the EMI test. It acquired a reputation as black magic that does not obey the laws of physics.

It obeys the laws of physics fine. **If you have an EMI problem, you accidentally built a radio transmitter.** Electromagnetic energy that you intended to send down a transmission line to a receiver found its way out of your box instead.

A transmitter needs a source and an antenna. You are going to have antennas no matter what, because signal wires go in and out of the product and those wires make excellent antennas. So the strategy is:

1. **Eliminate the source.** In thirty years of troubleshooting EMI problems, the dominant source has essentially always been PDS ripple. Not "usually." It is difficult to recall a case that was anything else.
2. **Avoid creating additional antennas**, since those are the exit path.

Which is why the number one item on the EMI presentation is: design a good PDS. And why the actual fix for a client's EMI problem is usually to redesign their power delivery.

One warning: there are no good tools for predicting EMI. Products have claimed to do it. None of them have actually solved the problem. PDS analysis tools, by contrast, exist and work.

---

## 10. Glass weave skew

This one crept in as data rates climbed past about 5 to 6 Gb/s, and it did not exist as a problem before that.

### The mechanism

Board dielectric is woven glass cloth impregnated with resin. The two materials have very different dielectric constants:

- **Glass: E_r ≈ 6**
- **Resin: E_r ≈ 3**

A common weave style, 1080 glass, distributes the fiber bundles non-uniformly with visible gaps. For scale, a 3.5 mil trace is comparable to the pitch features of the weave. So as a trace runs across the board, it passes alternately over glass bundles and over resin-filled gaps.

Two consequences:

1. **Impedance varies** along the trace. Higher E_r over the bundle gives lower impedance, and vice versa.
2. **Propagation velocity varies.** When E_r goes up, velocity goes down.

For a single-ended trace, you would never notice the second effect. For a differential pair it is fatal, because if the two members do not experience the same sequence of ups and downs, one signal arrives before the other. That difference in arrival time is **skew**.

### How bad it gets

Test boards built in 2013 used 14-inch traces over a glass style believed to be acceptable. Measured difference in arrival time between the two members of the pair: **62.5 picoseconds** over those 14 inches.

At 10 Gb/s that is **60% of a bit time**. The link fails.

And the industry is now at 28 and 56 Gb/s, where the bit time is a fraction of what it was in that measurement.

### The fix

Choose the glass style deliberately, favoring weaves where the fibers are spread out uniformly across the surface rather than bundled with gaps. This is why the glass weave has to be called out explicitly in your stackup drawing, and it is another reason the fabricator cannot own the stackup: they will substitute an equivalent-thickness weave that is not equivalent for your purposes.

---

## 11. Loss

The last thing to arrive as you climb the speed curve. Loss comes from two places:

1. **The copper traces**
2. **The dielectric**

Not much can be done about copper. Fortunes have been spent developing low-loss dielectrics, and extremely low-loss laminates are now readily available.

Two questions determine whether loss matters to you:

- **How long is the path?**
- **How high is the frequency?**

Loss grows with both. Around the 10 Gb/s range it becomes something you have to actively think about.

The method is the same as everywhere else in this lecture: use an SI tool that lets you incorporate the loss curves of your actual materials into the model, and simulate your proposed path with your proposed material set. If you climb the speed curve while continuing to use the materials you used for what you called low-speed boards, you will discover a problem. The good news is that switching laminates solves it, and the modern low-loss materials also solve the glass weave skew problem at the same time.

---

## 12. Putting it together

### The method, generalized

Every section of this lecture has the same shape:

1. Identify the physical mechanism.
2. Determine what the logic family can tolerate.
3. Propose a geometry or a material or a component value.
4. Calculate the result with an analytical tool (2D/3D field solver, PDS analysis, loss modeling).
5. Discover that your first guess was inadequate, and iterate.
6. Encode the result as a rule in the route control files so it is enforced automatically during layout, by hand or autoroute.

### On rules of thumb

There is a great deal of folklore in circulation. Spacing rules stated as 2H or 3H, parallel run length limits, guard traces, 0.1/0.01 µF bypass rules, length matching specs at suspiciously round numbers. These are arbitrary. If you follow them instead of doing the analysis, you are running an uncontrolled risk.

The tools all exist now and they all work well. That was not true when this discipline started.

### This is a team job

No one person can meet all these goals. The team is:

- **The circuit design engineer**
- **The SI engineer**
- **The board layout designer**
- **An engineer at the fab shop**

The fabricator belongs on the team, not because they should do your stackup, but because you need to pick materials and structures they can actually build. A stackup designed in isolation and thrown over the wall is not a manufacturable stackup.

---

## Quick reference

| Quantity | Value |
|---|---|
| Propagation velocity in PCB | 6 in/ns, 15 cm/ns |
| Trace inductance | ~3.5 nH/in, roughly structure-independent |
| Impedance | Z₀ = √(L₀/C₀), tune via C₀ (height and width) |
| Reflection coefficient | Γ = (Z_L − Z₀)/(Z_L + Z₀) |
| Critical length, reflections | Half the rise time in distance |
| Critical length, backward crosstalk | About a quarter of the rise time in distance |
| Typical modern edge rate | 100 ps (0.6 in); newest memory 50 ps |
| Crosstalk, 5/5/5 mil geometry | ~8% |
| Same, with 15 mil separation | ~0.8% |
| E_r glass / E_r resin | ~6 / ~3 |
| Interplane cap inductance vs. discrete | ~100× lower |
| Typical plane pair separation | 3 mils |
| Measured glass weave skew | 62.5 ps over 14 in on 1080 glass |

---

## Points worth verifying against other sources

Two places where this material is simplified, flagged so you know where to dig:

- **Forward crosstalk in stripline.** The lecture treats FEXT as a general phenomenon that grows without bound. In a homogeneous dielectric (true stripline), the inductive and capacitive coupling terms largely cancel and FEXT is close to zero. It is microstrip, where the fields see both air and dielectric, where FEXT is significant. The practical conclusion (backward crosstalk dominates on PCBs) still holds, but the reasoning is more specific than presented.
- **The overshoot/undershoot preference.** The claim that a slightly high termination is the safer error follows from modern low swings and small noise margins. It is worth checking against your specific receiver's input rating and its overshoot spec, particularly for parts with thin gate oxides where absolute maximum input ratings are tight.

---

## Source videos

Altium Academy high-speed design series, presented by Lee Ritchey (Speeding Edge):

1. What Is High Speed Design? — https://www.youtube.com/watch/HUJlJZTqzF4
2. Is a Signal High Speed? — https://www.youtube.com/watch/S_kVfl2EQqc
3. What is Impedance? — https://www.youtube.com/watch/L4zx6u5x5l0
4. Reflections in High-Speed Design — https://www.youtube.com/watch/FjF4vnxzirE
5. Understanding Crosstalk — https://www.youtube.com/watch/zOORgBmnDX8
6. Is Length Matching Required in High Speed Buses? — https://www.youtube.com/watch/0FbFUXF5x0o
7. Converting Parallel Busses to Differential Pairs — https://www.youtube.com/watch/fk9Aeq_KoyU
8. Effects of Poorly Designed Stack-ups — https://www.youtube.com/watch/FdlaGMRd9oI
9. Common Signal Integrity Issues — https://www.youtube.com/watch/LtAV3tY6GBU
10. How to Ensure Good Signal Integrity — https://www.youtube.com/watch/OdqOD4ooRhU
