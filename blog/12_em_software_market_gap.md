# The EM Simulation Market Was Never Built For You

A single-seat HFSS or CST license runs $20,000 to over $100,000 a year. Add thermal analysis, add more than four cores, add anything past the base package, and the number climbs again. If you're an independent engineer or a five-person hardware startup, you already know this — you priced it out and closed the tab.

The usual explanation is "enterprise software is expensive." True, but it skips the actual mechanism, and the mechanism is what tells you where the opportunity is.

---

## The tool follows the org chart, not the physics

Full-wave 3D EM simulation exists because Maxwell's equations don't care about your budget. Past a few GHz, lumped-element intuition about a trace stops working. Fields couple to the return path, to adjacent traces, to the enclosure. You need a solver that discretizes space and grinds through it numerically. That part is genuinely hard and genuinely necessary — whether you're a Fortune 500 company or a two-person startup in a garage.

What isn't dictated by physics is the packaging. The big EM vendors didn't build $100k/seat products because full-wave EM is $100k/seat hard. They built them because their actual customer is a 500-person engineering org that needs the solver to talk to PLM, to PDM, to a dozen other departments, under a compliance and security model a two-person team will never touch. Once that org has a few million dollars sunk into licenses, training, and file-format lock-in, switching cost becomes the product. The solver is almost incidental at that point — you're paying for organizational glue and for the fact that leaving is expensive.

So the pricing isn't a tax on the physics. It's a tax on being the wrong customer for the product. Most hardware startups are the wrong customer.

## There's a real gap, not just a price problem

This maps almost exactly onto the RTOS market: certified, supported options at one end for aerospace-grade needs, capable-but-unsupported free options at the other, and almost nobody serving the middle — a team with some budget and some time, but not enough of either to justify $50k in licensing or to build a support org from scratch in-house.

Computational electromagnetics has the same gap. On one end: HFSS, COMSOL, CST — accurate, integrated, expensive, built for teams that already have someone whose whole job is running the solver. On the other end: openEMS, Palace, FEniCSx, Gmsh, scikit-rf — free, capable, and genuinely rough. You're compiling from source, reading sparse docs, and debugging your own meshing before you ever get to the physics question you actually cared about.

Nobody's selling "accurate enough, fast enough, and doesn't require a PhD to operate" at a price a startup can justify without a board conversation. That's not hypothetical. It's the same gap that's about to get forced open by PCIe 6.0 and 7.0 — at those signaling rates, bit error rates get bad enough that board designers who have never opened a full-wave solver in their life are going to need one, on a deadline, with no six months to ramp up on a commercial tool.

## What's actually being paid for

Here's the part that doesn't get said out loud enough: the $50k license usually isn't buying capability the open-source stack lacks. A lot of the underlying numerics in commercial solvers and in something like openEMS are solving the same equations with comparable methods. What the license really buys is liability transfer. If a board fails compliance testing and you used a commercial solver, there's a vendor relationship and a paper trail. If you used a solver you compiled yourself off GitHub, there's just you.

That's a real thing to pay for. It's just a different thing than "better math," and conflating the two is how teams end up either overpaying for capability they don't need, or underinvesting because they assume the free tools can't possibly be good enough.

## Three actual paths, not two

Outsourcing and "build your own stack" both work, and both are legitimate depending on whether the need is recurring or occasional. But there's a third path the market hasn't really built yet: someone productizing the open-source stack itself. Not a from-scratch solver, and not an enterprise platform. A GUI, a hardened build, cloud compute on the back end, and someone who answers a support email when the mesh doesn't converge — sold at a price a startup can approve without a board vote.

Nobody's fully occupying that middle tier yet. Whoever does won't have invented new physics. They'll have done the less glamorous work of packaging what CFD did with OpenFOAM and applying it here: taking simulation capability that already exists in the open and making it something a two-person engineering team can pick up and use on a Tuesday.

That packaging problem — not new physics — is the actual thesis behind why Machshev Labs starts with expert-led sprints instead of a self-serve upload button. The services build the trust and the validated dataset first; the tooling that lets a team use it without an engineer in the loop comes after, not instead.
