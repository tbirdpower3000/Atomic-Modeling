# Python side of Atomic Modeling

The careful math lives here; the web app loads its results.

| Module | What it does | Runs on |
|---|---|---|
| `atomic_modeling/radial.py` | All-electron LDA atoms on a radial grid (Slater exchange + VWN5 correlation), Z = 1–36 and beyond | CPU (milliseconds to seconds per atom) |
| `atomic_modeling/grid3d.py` | 3D Schrödinger solver, FFT split-operator, excited states, cube-file export | **CUDA through CuPy**, or NumPy |
| `atomic_modeling/export.py` | Writes `data/radial_atoms.json` for the web app | CPU |

## Install

```
pip install numpy scipy pytest
pip install cupy-cuda12x        # optional: NVIDIA GPU (pick the wheel matching your CUDA version)
```

The backend is chosen automatically: CuPy when an NVIDIA GPU is found, NumPy otherwise.
Force one with `ATOMIC_BACKEND=numpy` or `ATOMIC_BACKEND=cupy`.

## Use

```
cd python
python -m atomic_modeling.grid3d 64 128 256   # benchmark; prints which backend is in use
python -m atomic_modeling.export              # regenerate data/radial_atoms.json
python -m pytest -q                           # checks against NIST and analytic results
```

```python
from atomic_modeling.radial import solve_atom
kr = solve_atom(36)
print(kr.total_energy, kr.eigenvalues["4p"])   # -2750.148 hartree, -0.34634 hartree (NIST: -2750.147940, -0.346340)

from atomic_modeling.grid3d import Grid, h2_plus, solve, write_cube
g = Grid(128, 10.0)
states = solve(g, h2_plus(g, bond=2.0), nstates=2)
write_cube("h2plus.cube", g, states[0].psi)    # open in VESTA or 3Dmol
```

## Accuracy

- **Radial atoms:** total energies and orbital energies agree with the NIST LDA reference tables to about 1e-4 hartree or better (see `tests/test_radial.py`).
- **Ionization energies** are computed the honest way, as E(ion) − E(atom), not from the top orbital energy. Typical error is a few tenths of an eV; open-shell atoms such as oxygen and fluorine are worse because this version is not spin-polarized.
- **3D grid:** exact for smooth potentials (harmonic oscillator to 1e-3). A bare nucleus has a cusp no uniform grid resolves, so hydrogen is a few percent high; use the radial solver for accurate atomic numbers and the 3D solver for shapes, molecules and dynamics.
