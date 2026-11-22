"""Radial LDA solver against the NIST Atomic Reference Data for Electronic Structure Calculations.
https://math.nist.gov/DFTdata/atomdata/tables/ptable.html  (LDA column)"""
import pytest
from atomic_modeling.radial import solve_atom, solve_atom_lsd, configuration, _grid, _solve_l

# (Z, total energy, {orbital: eigenvalue}) in hartree
NIST = [
    (2, -2.834836, {"1s": -0.570425}),
    (3, -7.335195, {"2s": -0.105545}),
    (10, -128.233481, {"2p": -0.498034}),
    (18, -525.946195, {"1s": -113.800134, "2s": -10.794172, "2p": -8.443439, "3s": -0.883384, "3p": -0.382330}),
]


def test_hydrogen_like_levels_are_exact():
    x, r = _grid(1, 0.004)
    w, _ = _solve_l(r, 0.004, -1.0 / r, 0, 3, 1)
    for n, e in enumerate(w, start=1):
        assert e == pytest.approx(-0.5 / n**2, abs=2e-6)


@pytest.mark.parametrize("Z,etot,eps", NIST)
def test_matches_nist_lda(Z, etot, eps):
    a = solve_atom(Z, dx=0.003)
    assert a.total_energy == pytest.approx(etot, abs=3e-4 * max(1, Z / 10))
    for k, v in eps.items():
        assert a.eigenvalues[k] == pytest.approx(v, abs=1e-4)


def test_configurations():
    assert configuration(6) == {"1s": 2, "2s": 2, "2p": 2}
    assert configuration(24)["3d"] == 5 and configuration(24)["4s"] == 1
    assert configuration(29)["3d"] == 10 and configuration(29)["4s"] == 1
    assert sum(configuration(36).values()) == 36


# NIST LSD column (spin-polarized): (Z, occupations or None for the neutral atom, total energy)
NIST_LSD = [(3, None, -7.343957), (3, {"1s": 2}, -7.142818), (8, None, -74.527410), (8, {"1s": 2, "2s": 2, "2p": 3}, -74.016721)]


@pytest.mark.parametrize("Z,occ,etot", NIST_LSD)
def test_matches_nist_lsd(Z, occ, etot):
    a = solve_atom_lsd(Z, dx=0.004, occupations=occ)
    assert a.total_energy == pytest.approx(etot, abs=5e-5)


def test_spin_fixes_oxygen_ionization_energy():
    atom = solve_atom_lsd(8, dx=0.004)
    ion = solve_atom_lsd(8, dx=0.004, occupations={"1s": 2, "2s": 2, "2p": 3})
    ie = (ion.total_energy - atom.total_energy) * 27.211386
    assert ie == pytest.approx(13.618, abs=0.4)      # measured 13.618 eV; without spin this model gives 16.6
