"""Generate the data files the web app loads.  Run:  python -m atomic_modeling.export"""
from __future__ import annotations
import json, os, sys, time
from .radial import solve_atom, configuration, HARTREE_EV, LETTERS

# measured first ionization energies (eV), NIST ASD, Z = 1..36
IE_MEASURED = [13.598, 24.587, 5.392, 9.323, 8.298, 11.260, 14.534, 13.618, 17.423, 21.565, 5.139, 7.646, 5.986, 8.152,
               10.487, 10.360, 12.968, 15.760, 4.341, 6.113, 6.561, 6.828, 6.746, 6.767, 7.434, 7.902, 7.881, 7.640,
               7.726, 9.394, 5.999, 7.899, 9.789, 9.752, 11.814, 14.000]


def ion_configuration(Z: int) -> dict:
    """Singly charged ion: transition metals lose a 4s electron first, everything else its last shell."""
    occ = dict(configuration(Z))
    if 21 <= Z <= 30 and occ.get("4s", 0) > 0:
        k = "4s"
    else:
        k = list(occ)[-1] if "4p" not in occ else "4p"
        if k not in occ or occ[k] <= 0:
            k = list(occ)[-1]
    occ[k] -= 1
    return {a: b for a, b in occ.items() if b > 0}


def build(zmax: int = 36, dx: float = 0.003, out: str | None = None, verbose: bool = True) -> dict:
    data = {"method": "all-electron LDA (Slater exchange + VWN5 correlation), spin-unpolarized, spherical, non-relativistic",
            "units": "hartree for energies unless a key ends in _eV", "atoms": {}}
    for Z in range(1, zmax + 1):
        t = time.time()
        a = solve_atom(Z, dx)
        entry = {"config": a.occupations, "E": round(a.total_energy, 6),
                 "eps": {k: round(v, 6) for k, v in a.eigenvalues.items()},
                 "homo": a.homo[0], "homo_eV": round(-a.homo[1] * HARTREE_EV, 3), "ie_measured_eV": IE_MEASURED[Z - 1]}
        if Z > 1:
            ion = solve_atom(Z, dx, occupations=ion_configuration(Z))
            entry["E_ion"] = round(ion.total_energy, 6)
            entry["ie_dscf_eV"] = round((ion.total_energy - a.total_energy) * HARTREE_EV, 3)
        else:
            entry["E_ion"] = 0.0
            entry["ie_dscf_eV"] = round(-a.total_energy * HARTREE_EV, 3)
        # mean radius of the outermost shell, for drawing
        r, u = a.r, a.orbitals[a.homo[0]]
        import numpy as np
        dxg = np.log(r[1] / r[0])
        entry["r_outer"] = round(float(np.sum(u * u * r * r) * dxg), 4)
        data["atoms"][str(Z)] = entry
        if verbose:
            print(f"Z={Z:2d} E={entry['E']:.6f} IE(dSCF)={entry['ie_dscf_eV']:.2f} eV  measured {IE_MEASURED[Z - 1]:.2f}  ({time.time() - t:.1f}s)", flush=True)
    if out:
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w") as f:
            json.dump(data, f, separators=(",", ":"))
    return data


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    build(out=os.path.join(here, "..", "..", "data", "radial_atoms.json"))
