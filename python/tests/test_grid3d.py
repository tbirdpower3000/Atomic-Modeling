"""3D FFT solver: analytic checks that run on either backend."""
import pytest
from atomic_modeling.grid3d import Grid, harmonic, coulomb, solve, upsample
from atomic_modeling.backend import xp


def test_harmonic_oscillator_levels():
    g = Grid(32, 6.0)
    st = solve(g, harmonic(g, 1.0), nstates=4)
    assert st[0].energy == pytest.approx(1.5, abs=2e-3)          # 3/2 hbar omega
    for s in st[1:]:
        assert s.energy == pytest.approx(2.5, abs=5e-3)          # three-fold degenerate first excited level


def test_hydrogen_ground_state_is_bound_and_converging():
    e = []
    for n in (32, 48):
        g = Grid(n, 8.0)
        e.append(solve(g, coulomb(g, 1.0), 1)[0].energy)
    assert -0.5 < e[1] < e[0] < -0.40          # approaches -0.5 from above as the grid refines


def test_upsample_preserves_norm_and_shape():
    g = Grid(16, 6.0)
    psi = solve(g, harmonic(g, 1.0), 1)[0].psi
    big = upsample(psi, 2)
    assert big.shape == (32, 32, 32)
    assert float(xp.sum(big * big)) == pytest.approx(1.0, abs=1e-5)
