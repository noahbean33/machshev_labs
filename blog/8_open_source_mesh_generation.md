# The Best Open-Source Mesh Generation Libraries

In engineering simulation, the tools you use can make a significant difference in the efficiency and effectiveness of a project. Open-source software has emerged as a powerful alternative to proprietary tools, offering flexibility, cost savings, and a vibrant developer community.

One of the main appeals of open-source tools is that they eliminate the need for expensive licenses, making high-quality software accessible to small businesses, startups, and individual engineers. With access to the source code, users can also customize and adapt the tools to their specific needs.

Are there shortcomings? How do these libraries compare on ease of use and feature parity with their commercial counterparts? This post gives a quick overview of some of the most important open-source meshing tools, and the challenges they present for engineering projects.

---

## Meshing and pre-processing platforms

The first type of project users typically encounter is the large "pre-processing platform" that integrates many algorithms and functions — including some that overlap with CAD software rather than pure mesh generation. The two most well-known are Gmsh and Salome.

### Salome — comprehensive pre- and post-processing

Salome integrates multiple open-source tools into a comprehensive pre- and post-processing environment. It includes a GUI for geometry and meshing tasks and supports Python scripting to automate workflows.

- **License:** GNU Lesser General Public License (LGPL)
- **Website:** [Salome](https://www.salome-platform.org/)

### Gmsh — flexible meshing for 3D simulations

Gmsh is known for its powerful meshing algorithms and flexibility. It offers a GUI for basic operations and extensive scripting in Python and its own `.geo` scripting language for advanced meshing tasks, plus bindings to many third-party open-source libraries for specific low-level routines.

- **License:** GNU General Public License (GPL), with AGPL components (e.g. TetGen)
- **Website:** [Gmsh](https://gmsh.info/)

### Netgen — a pre-processing platform

Netgen produces high-quality surface and volume meshes for finite element simulations. Tightly integrated with NGSolve, it relies on a Python interface and a GUI. It includes its own constructive solid geometry (CSG) system for parametric modelling, and supports boundary representations via STL as well as STEP and IGES through the OpenCascade CAD kernel.

- **License:** GNU Lesser General Public License (LGPL)
- **Website:** [NGSolve](https://ngsolve.org/)

### OpenFOAM snappyHexMesh — hex meshing for CFD

OpenFOAM is primarily a CFD tool, but it ships its own meshing routines. `snappyHexMesh` is one of its key meshing utilities, generating 3D meshes from hexahedral and split-hexahedral elements. It's particularly suited to complex geometries, working directly from triangulated surface data such as STL files — automatically refining and snapping the mesh to surfaces, with support for local refinement, boundary layer generation, and mesh smoothing.

- **License:** GPL
- **Website:** [OpenFOAM](https://openfoam.org/)

## Lower-level 3D meshing libraries

### TetGen — efficient tetrahedral mesh generation

TetGen specializes in efficient tetrahedral meshes for 3D simulations requiring complex meshing. No native GUI, but it integrates with other tools and can be scripted in Python.

- **License:** Affero General Public License (AGPL)
- **Website:** [TetGen, WIAS Berlin](https://wias-berlin.de/software/tetgen/)

### TetWild — robust tetrahedral meshing

TetWild focuses on robust tetrahedral meshing and handles challenging geometries with ease. It can be scripted in Python for customized workflows.

- **License:** Mozilla Public License 2.0 (contains CGAL code under GPL)
- **Website:** search GitHub for TetWild / the wildmeshing toolkit for the current maintained repository

### MMG3D — automatic 3D mesh adaptation

MMG3D focuses on remeshing rather than meshing — adapting tetrahedral meshes to complex geometries and improving mesh quality. No GUI, but it integrates easily into other software and scripts in Python for automated adaptation.

- **License:** GNU Lesser General Public License (LGPL)
- **Website:** [MMG](https://www.mmgtools.org/)

### CGAL Mesh Generation Package

Part of the Computational Geometry Algorithms Library, CGAL's mesh generation package produces high-quality tetrahedral meshes for 3D domains as well as 2D triangular and 1D meshes, for FEM and numerical simulation. It supports complex geometries — implicit functions, CAD data, polyhedral surfaces — with adaptive meshing based on user-defined criteria.

- **License:** Mixed LGPL/GPL; a commercial license is also offered
- **Website:** [CGAL](https://www.cgal.org/)

### Constrained Delaunay Tetrahedralization

A family of algorithms for producing constrained Delaunay tetrahedralizations, useful for applications needing high-quality meshes under specific geometric constraints. Implementations vary in license and maturity — check current GitHub activity before picking one for a production pipeline.

## 2D meshing

Gmsh handles 2D meshing too, but can be overkill for that alone. For a lightweight, powerful 2D-specific solution:

### Triangle — high-quality 2D meshes

Triangle excels at high-quality triangular meshes for planar problems. No GUI; controlled via command line and scriptable in Python.

- **License:** Non-commercial
- **Website:** [Triangle](https://www.cs.cmu.edu/~quake/triangle.html)

### scipy.spatial.Delaunay

Part of SciPy, this provides Delaunay triangulation of a point set. Mostly used in 2D but supports N dimensions — the function takes input points and constructs simplices (triangles in 2D, tetrahedra in 3D) covering the convex hull, ensuring no point lies inside another simplex's circumcircle.

- **License:** BSD
- **Website:** [SciPy](https://scipy.org/)

### CDT — Constrained Delaunay Triangulation (2D)

A header-only C++ library for 2D Constrained Delaunay Triangulations — fast, numerically robust, and easy to integrate. Handles complex boundaries including segments and holes.

- **License:** MPL-2.0
- **Website:** [GitHub](https://github.com/artem-ogre/CDT)

## Potential challenges and sweet spots

In many simulation problems, geometry is simple but the physics is genuinely challenging — a situation that comes up constantly in both academic research and industry. Where geometric requirements are straightforward enough to script or draw with ease, open-source meshing tools deliver nearly all of the benefit with very few of the drawbacks: the ideal case for a non-expert user.

The challenges show up with complex geometries specifically:

- **GUI limitations.** Tools like Gmsh have powerful algorithms but limited GUIs. Getting full value out of them means scripting — an investment that pays off over time.
- **CAD-to-mesher communication.** Getting CAD software and the mesher to communicate cleanly is tricky; surface and volume markers can get lost in the transition.
- **CAD model preparation.** Not specific to open-source, but real: geometry imperfections, inconsistent surface definitions, and complex topology often require extensive manual cleanup before meshing will behave.

## Conclusion

Open-source meshing tools offer a compelling alternative to proprietary software — real flexibility and real cost savings. They present unique challenges for very complex geometries, but the benefits make them a valuable part of any engineer's toolkit.
