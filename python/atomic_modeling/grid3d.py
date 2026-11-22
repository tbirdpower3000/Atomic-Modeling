"""3D time-independent Schrodinger solver on a cubic grid.

Imaginary-time propagation with the split-operator method: the kinetic step is exact in
Fourier space (FFT), so there is no finite-difference error and time steps can be ~50x larger
than an explicit stencil allows.  Every array lives on the active backend, so on an NVIDIA GPU
the FFTs run on CUDA (cuFFT) through CuPy.

Units: hbar = m = 1 (hartree atomic units for electrons).
"""
from __future__ import annotations
from dataclasses import dataclass, field
import time
import numpy as np
from .backend import xp, to_numpy, sync, backend_name


@dataclass
class Grid:
    n: int = 64            # points per side
    half_width: float = 10.0
    dtype: str = "float32"

    def __post_init__(self):
        self.h = 2 * self.half_width / self.n
        ax = (xp.arange(self.n, dtype=self.dtype) + 0.5 - self.n / 2) * self.h
        self.x, self.y, self.z = xp.meshgrid(ax, ax, ax, indexing="ij")
        k = 2 * np.pi * xp.fft.fftfreq(self.n, d=self.h).astype(self.dtype)
        kx, ky, kz = xp.meshgrid(k, k, k, indexing="ij")
        self.k2 = kx * kx + ky * ky + kz * kz

    @property
    def r(self):
        return xp.sqrt(self.x**2 + self.y**2 + self.z**2)


# ------------------------------------------------------------------ potentials
def coulomb(g: Grid, Z: float = 1.0, soft: float = 0.0, center=(0.0, 0.0, 0.0)):
    """Nucleus at `center`: -Z / sqrt(r^2 + (soft*h)^2).  Grid points are cell-centred, so soft=0
    never divides by zero; the cusp is still under-resolved, which is why accurate atomic numbers
    come from radial.py and this solver is for shapes, molecules and dynamics."""
    r2 = (g.x - center[0]) ** 2 + (g.y - center[1]) ** 2 + (g.z - center[2]) ** 2
    return -Z / xp.sqrt(r2 + (soft * g.h) ** 2)


def h2_plus(g: Grid, bond: float = 2.0, soft: float = 0.0):
    return coulomb(g, 1, soft, (0, 0, bond / 2)) + coulomb(g, 1, soft, (0, 0, -bond / 2))


def harmonic(g: Grid, omega: float = 1.0):
    return 0.5 * omega**2 * g.r**2


# ------------------------------------------------------------------ solver
@dataclass
class State:
    energy: float
    psi: object = field(repr=False)
    steps: int = 0


def _energy(g, V, psi):
    kin = xp.fft.ifftn(0.5 * g.k2 * xp.fft.fftn(psi)).real
    return float(xp.sum(psi * (kin + V * psi)) / xp.sum(psi * psi))


def solve(g: Grid, V, nstates: int = 1, dt: float = 0.05, tol: float = 1e-7, maxsteps: int = 20000,
          check: int = 20, seed: int = 0, guess=None, verbose: bool = False) -> list[State]:
    """Lowest `nstates` eigenstates of -1/2 laplacian + V.  Returns them in order of energy."""
    rng = np.random.default_rng(seed)
    expV = xp.exp(-0.5 * dt * V)
    expT = xp.exp(-0.5 * dt * g.k2)
    found: list[State] = []
    for s in range(nstates):
        if guess is not None and s < len(guess):
            psi = xp.asarray(guess[s], dtype=g.dtype)
        else:
            psi = xp.asarray(rng.standard_normal((g.n,) * 3), dtype=g.dtype) * xp.exp(-(g.r / (0.35 * g.half_width)) ** 2)
        last, e = None, 0.0
        for step in range(1, maxsteps + 1):
            psi = expV * psi
            psi = xp.fft.ifftn(expT * xp.fft.fftn(psi)).real.astype(g.dtype)
            psi = expV * psi
            for f in found:                      # stay orthogonal to the states already found
                psi = psi - xp.sum(psi * f.psi) * f.psi
            psi = psi / xp.sqrt(xp.sum(psi * psi))
            if step % check == 0:
                e = _energy(g, V, psi)
                if verbose:
                    print(f"  state {s + 1} step {step}: E = {e:.7f}")
                if last is not None and abs(e - last) < tol * max(1.0, abs(e)):
                    break
                last = e
        found.append(State(e, psi, step))
    return found


def upsample(psi, factor: int = 2):
    """Enlarge a solution to a finer grid by zero-padding its Fourier transform (exact for
    band-limited fields): the coarse-to-fine trick used by the web app, done spectrally."""
    n = psi.shape[0]
    N = n * factor
    F = xp.fft.fftshift(xp.fft.fftn(psi))
    out = xp.zeros((N,) * 3, dtype=F.dtype)
    a = (N - n) // 2
    out[a:a + n, a:a + n, a:a + n] = F
    big = xp.fft.ifftn(xp.fft.ifftshift(out)).real
    return (big / xp.sqrt(xp.sum(big * big))).astype(psi.dtype)


def write_cube(path: str, g: Grid, psi, comment: str = "wavefunction", atoms=((1, 0.0, 0.0, 0.0),)):
    """Gaussian cube file, readable by VESTA, 3Dmol, Jmol, VMD."""
    a = to_numpy(psi) / g.h**1.5       # normalize so that sum |psi|^2 h^3 = 1
    o = -g.half_width + 0.5 * g.h
    with open(path, "w") as f:
        f.write(f"Atomic Modeling cube file\n{comment}\n")
        f.write(f"{len(atoms):5d}{o:12.6f}{o:12.6f}{o:12.6f}\n")
        for i in range(3):
            v = [0.0, 0.0, 0.0]; v[i] = g.h
            f.write(f"{g.n:5d}{v[0]:12.6f}{v[1]:12.6f}{v[2]:12.6f}\n")
        for Z, x, y, z in atoms:
            f.write(f"{Z:5d}{float(Z):12.6f}{x:12.6f}{y:12.6f}{z:12.6f}\n")
        flat = a.reshape(-1)
        for i in range(0, flat.size, 6):
            f.write(" ".join(f"{v:13.5e}" for v in flat[i:i + 6]) + "\n")


def benchmark(sizes=(64, 128), nstates: int = 1):
    """Time the hydrogen ground state on each grid; prints the backend so you can see CUDA at work."""
    print(f"backend: {backend_name}")
    rows = []
    for n in sizes:
        g = Grid(n, 10.0)
        V = coulomb(g, 1.0)
        sync(); t = time.perf_counter()
        st = solve(g, V, nstates)
        sync(); dt = time.perf_counter() - t
        rows.append((n, st[0].energy, st[0].steps, dt))
        print(f"  {n}^3: E = {st[0].energy * 27.211386:8.4f} eV (exact -13.6057), {st[0].steps} steps, {dt:.2f} s, "
              f"{st[0].steps * n**3 / dt / 1e6:.0f} million point-steps/s")
    return rows


if __name__ == "__main__":
    import sys
    benchmark(tuple(int(a) for a in sys.argv[1:]) or (64, 128))
