# Open-Source Electromagnetics: FDTD, FEM, and MoM

Computational electromagnetics spans a wide range of application areas — antennas, nanophotonics, solar cells, metamaterials, lasers, and more — and there are several distinct ways to approach the underlying computation.

There are three major families of numerical method for electromagnetic simulation: FDTD, FEM, and MoM. Each is best suited to certain cases, with its own advantages and disadvantages. This post covers the basic trade-offs between them, with references to some of the best open-source implementations of each.

---

## FDTD, FEM, and MoM at a glance

| Method | Solver type | Discretization | Material type |
|---|---|---|---|
| FDTD | Differential equation | Volumetric domain | Non-linear, anisotropic |
| FEM | Variational form | Volumetric domain | Non-linear, anisotropic, multi-physics |
| MoM / BEM | Integral equations | Surface currents | Linear, piecewise homogeneous |

## Finite-Difference Time-Domain (FDTD)

FDTD applies finite differences to Maxwell's equations in a second-order, stable, staggered-grid scheme for the electric and magnetic fields. The method was introduced in a seminal 1966 paper by Kane Yee; the term "FDTD" was popularized later, by Taflove, in the 1980s.

**Advantages**

- Time-domain by nature, so it supports a wide range of frequencies in a single run — valuable for broadband analysis.
- Non-linear materials are straightforward to incorporate.
- Explicit time-stepping and relative simplicity make it easy to parallelize and implement across computational environments.

**Disadvantages**

That time-domain flexibility comes at a price:

- **Complex geometries are hard to accommodate.** FDTD uses a global grid-like mesh, so applying it to a complex geometry ends up with unnecessarily high resolution in regions where it isn't needed. Mesh size scales roughly like \((\lambda/dx)^3\), where \(\lambda\) is the wavelength and \(dx\) is the finest geometric resolution required. Graded meshes help, but remain global in nature, which limits how much they can compensate. Combined with the CFL condition — under which the time step \(\Delta t\) scales with \(\Delta x\) — total compute time scales roughly like \((\lambda/dx)^4\).
- **Error accumulates over time.** As with any finite-difference method, wave propagation on the discrete grid doesn't obey the exact dispersion relation of Maxwell's equations, but an approximate version of it. This numerical dispersion error can become one of FDTD's main accuracy limitations.
- The combination of a global grid and dispersion error makes high-frequency propagation genuinely challenging: the initial error, and therefore the required grid size, has to be small enough to compensate for accumulation. Taflove reports needing a discretization finer than 1/100th wavelength to reach 1.5 dB accuracy in one such study.

**Best open-source FDTD codes**

| Software | License | Written in | Interface | Parallelization |
|---|---|---|---|---|
| Meep | GPL | C++ | Python, Scheme, C++ | MPI |
| gprMax | GPL | Python + Cython | Python | CUDA, MPI |
| openEMS | GPL | C++ | MATLAB, Python | MPI |

- **Meep.** Developed at MIT — a highly efficient FDTD package, scriptable in Python or Scheme, or callable from C++. Parallelized with MPI, with a library covering a variety of material types. Recommended for optics and photonics.
- **openEMS.** Developed at the University of Duisburg-Essen and parallelized with MPI. MATLAB or Octave are the main scripting interfaces; the related pyEMS project provides a high-level Python interface. Recommended for RF applications.
- **gprMax.** Developed at the University of Edinburgh for modelling Ground Penetrating Radar, but usable for electromagnetic wave propagation more broadly. Command-line driven, written in Python with performance-critical parts in Cython/OpenMP.

## Finite Element Method (FEM)

FEM is a widely used approach for solving PDEs, particularly effective in computational electromagnetics for its flexibility with complex geometries. It's built on a weak integral formulation, obtained by multiplying the PDE by test functions and integrating by parts. Unknowns and test functions are then restricted to suitable discrete spaces, typically producing sparse linear algebra problems.

Run in the frequency domain, as it usually is, FEM doesn't suffer from FDTD's dispersion error. It can also be used as part of a time-stepping scheme, in which case the same dispersion concerns reappear. FEM is also well suited to multi-physics problems — electromagnetism coupled with elasticity, heat transfer, or fluid dynamics — since substantial existing software can be reused.

**Disadvantages**

- **Volumetric meshing is challenging.** Generating accurate volumetric meshes is complex and time-consuming, often requiring significant manual effort. Automated meshing exists but has limits on quality.
- **Steeper learning curve.** FEM demands more intricate setup and a deeper understanding than FDTD.
- **Less efficient for homogeneous materials and large open regions.** FEM's volumetric discretization requires meshing the entire domain — even uniform, linear-material regions or large open spaces — making it less efficient than surface-based methods like BEM.

**Best open-source FEM codes for electromagnetism**

| Software | License | Written in | Interface | Parallelization |
|---|---|---|---|---|
| Elmer FEM | LGPL | Fortran | GUI, config file | MPI |
| FEniCS | LGPL | C++ | Python, C++ | MPI |
| Palace | Apache-2.0 | C++ | Config file | MPI and GPU |

- **Elmer FEM.** An open-source finite element solver for multiphysical simulations, with built-in electromagnetics solvers for magnetostatics, electrostatics, and the wave equation. Uses a configuration file, which can be generated via GUI; the related pyelmer project offers an alternative way to generate those files.
- **FEniCS.** A popular LGPLv3 package for solving PDEs, with high-level Python and C++ interfaces and support for high-performance clusters. The FEniCS tutorial includes a magnetostatics example.
- **Palace.** Developed at AWS and aimed at quantum-computing hardware simulation, built on MFEM and libCEED. A high-performance FEM solver for large-scale electromagnetic simulation on HPC systems, with advanced solvers — and notably the steepest learning curve of the three, reflecting its HPC focus.

## Method of Moments (MoM) / Boundary Element Method (BEM)

MoM is a frequency-domain method for electromagnetic simulation that enforces radiation boundary conditions automatically, without discretizing a large volume of air around the geometry of interest.

Its main advantage is that it only requires meshing surfaces, giving it a substantial computational edge over FDTD and FEM. As a frequency-domain method, it doesn't suffer from numerical dispersion either.

Its main drawback: it's best suited to linear problems and piecewise-homogeneous materials, and it's harder to parallelize.

**Best open-source MoM codes**

| Software | License | Written in | Interface | Input meshes | Parallelization |
|---|---|---|---|---|---|
| Bempp | MIT | Python | Python, C++ | Gmsh, meshio | Shared memory |
| PumaEM | GPLv3 | C++, Fortran | Python | Gmsh, GiD, Ansys, VRML | MPI |
| NEC-2 | GPLv2 | C++ | C++, Python, Ruby | Antenna parameters | None |
| Traceon | Open-core | Python + C | Python | Own geometry module | Shared memory |

- **Bempp.** An MIT-licensed computational boundary element platform for electrostatic, acoustic, and electromagnetic problems. Uses JIT-compiled OpenCL or Numba kernels to assemble BEM operators on CPU or GPU, with a Python interface, Fast Multipole Method acceleration via ExaFMM-t, and coupled FEM/BEM computation via FEniCS interfaces.
- **PumaEM.** A GPLv3 Method of Moments implementation, accelerated with the Multilevel Fast Multipole Method and parallelized via MPI.
- **NEC-2.** A classical LLNL code, rewritten in C++, targeted at wire and surface antenna simulation. CocoaNEC provides a macOS GUI.
- **Traceon.** An open-core project for electron optics simulation using Boundary Element Methods and particle tracing — an open-source core with some features reserved for a commercial version.
