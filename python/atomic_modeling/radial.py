"""All-electron radial Kohn-Sham solver for neutral atoms (spherical, spin-unpolarized LDA).

Matches the conventions of the NIST "Atomic Reference Data for Electronic Structure
Calculations" LDA tables: Slater exchange + VWN5 correlation, spherically averaged
occupations, non-relativistic.

The radial equation for u = r R is solved on a logarithmic grid x = ln r. With u = sqrt(r) y it
becomes  -y'' + [(l+1/2)^2 + 2 r^2 V] y = 2 E r^2 y,  a generalized symmetric tridiagonal
eigenproblem that is turned into a standard one and solved with LAPACK.  The O(dx^2) error is
removed by Richardson extrapolation over two grid spacings.

Hartree atomic units throughout.
"""
from __future__ import annotations

from dataclasses import dataclass, field
import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import eigsh

HARTREE_EV = 27.211386245988

# ---------------------------------------------------------------- configurations
_AUFBAU = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p"]
_CAP = {"s": 2, "p": 6, "d": 10, "f": 14}
# ground-state exceptions to the Madelung rule (Z <= 54 shown; enough for the app's range)
_EXCEPT = {24: {"4s": 1, "3d": 5}, 29: {"4s": 1, "3d": 10}, 41: {"5s": 1, "4d": 4}, 42: {"5s": 1, "4d": 5},
           44: {"5s": 1, "4d": 7}, 45: {"5s": 1, "4d": 8}, 46: {"5s": 0, "4d": 10}, 47: {"5s": 1, "4d": 10}}
LETTERS = "spdf"


def configuration(Z: int) -> dict[str, float]:
    """Ground-state occupations, e.g. {'1s': 2, '2s': 2, '2p': 2} for carbon."""
    occ, left = {}, Z
    for sh in _AUFBAU:
        if left <= 0:
            break
        k = min(left, _CAP[sh[-1]])
        occ[sh] = k
        left -= k
    for sh, k in _EXCEPT.get(Z, {}).items():
        occ[sh] = k
    # re-balance the total after exceptions (exceptions move electrons between s and d)
    diff = Z - sum(occ.values())
    if diff:
        last = [s for s in _AUFBAU if s in occ][-1]
        occ[last] += diff
    return {k: v for k, v in occ.items() if v > 0}


# ---------------------------------------------------------------- exchange-correlation
def lda_xc(rho: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Return (energy density per electron, potential) for Slater exchange + VWN5 correlation."""
    rho = np.maximum(rho, 1e-30)
    kf = np.cbrt(3.0 * rho / np.pi)
    ex, vx = -0.75 * kf, -kf
    rs = np.cbrt(3.0 / (4.0 * np.pi * rho))
    A, b, c, x0 = 0.0310907, 3.72744, 12.9352, -0.10498
    Q = np.sqrt(4 * c - b * b)
    x = np.sqrt(rs)
    X = x * x + b * x + c
    X0 = x0 * x0 + b * x0 + c
    at = np.arctan(Q / (2 * x + b))
    ec = A * (np.log(x * x / X) + 2 * b / Q * at
              - b * x0 / X0 * (np.log((x - x0) ** 2 / X) + 2 * (b + 2 * x0) / Q * at))
    dec = A * (2 / x - (2 * x + b) / X - 4 * b / ((2 * x + b) ** 2 + Q * Q)
               - b * x0 / X0 * (2 / (x - x0) - (2 * x + b) / X - 4 * (b + 2 * x0) / ((2 * x + b) ** 2 + Q * Q)))
    vc = ec - x / 6.0 * dec
    return ex + ec, vx + vc


# ---------------------------------------------------------------- solver
@dataclass
class AtomResult:
    Z: int
    occupations: dict
    eigenvalues: dict          # 'nl' -> hartree
    total_energy: float        # hartree
    iterations: int
    r: np.ndarray = field(repr=False)
    density: np.ndarray = field(repr=False)
    orbitals: dict = field(repr=False, default_factory=dict)   # 'nl' -> u(r) = r R(r)

    @property
    def homo(self) -> tuple[str, float]:
        k = max(self.eigenvalues, key=self.eigenvalues.get)
        return k, self.eigenvalues[k]


def _grid(Z, dx, rmin=1e-7, rmax=60.0):
    x = np.arange(np.log(rmin / Z), np.log(rmax) + dx, dx)
    return x, np.exp(x)


def _nodes(u, r):
    m = np.abs(u) > 1e-6 * np.max(np.abs(u))
    sg = np.sign(u[m])
    return int(np.sum(sg[1:] != sg[:-1]))


def _solve_l(r, dx, V, l, nstates, Z, guess=None):
    """Lowest bound states for angular momentum l: shift-invert Lanczos on A y = E B y.

    With `guess` (the previous SCF cycle's eigenvalues) each state is found with its own shift,
    which converges in a few Lanczos steps; the node count guards against landing on a neighbour.
    """
    n = r.size
    A = sp.diags([np.full(n - 1, -1.0 / dx**2), 2.0 / dx**2 + (l + 0.5) ** 2 + 2 * r * r * V, np.full(n - 1, -1.0 / dx**2)], [-1, 0, 1], format="csc")
    B = sp.diags(2 * r * r, 0, format="csc")

    def finish(w, y):
        u = np.sqrt(r)[:, None] * y
        return w, u / np.sqrt(np.sum(u * u * r[:, None], axis=0) * dx)   # integral u^2 dr, dr = r dx

    if guess is not None:
        ws, ys, ok = [], [], True
        for k in range(nstates):
            try:
                w, y = eigsh(A, k=1, M=B, sigma=guess[k] - 1e-3 * abs(guess[k]) - 1e-6, which="LM")
            except Exception:
                ok = False
                break
            if _nodes(np.sqrt(r) * y[:, 0], r) != k:
                ok = False
                break
            ws.append(w[0]); ys.append(y[:, 0])
        if ok:
            return finish(np.array(ws), np.array(ys).T)
    w, y = eigsh(A, k=nstates, M=B, sigma=-float(Z) * Z, which="LM")
    o = np.argsort(w)
    return finish(w[o], y[:, o])


def _hartree(r, dx, rho):
    q = 4 * np.pi * r**3 * rho * dx          # charge in each shell (dV = 4 pi r^3 dx)
    inner = np.cumsum(q) - 0.5 * q
    outer = (np.cumsum((q / r)[::-1])[::-1]) - 0.5 * q / r
    return inner / r + outer


def solve_atom(Z: int, dx: float = 0.004, tol: float = 1e-9, mix: float = 0.35, maxit: int = 400,
               occupations: dict | None = None) -> AtomResult:
    occ = occupations or configuration(Z)
    x, r = _grid(Z, dx)
    byl: dict[int, list[tuple[int, str, float]]] = {}
    for nl, f in occ.items():
        n, l = int(nl[:-1]), LETTERS.index(nl[-1])
        byl.setdefault(l, []).append((n, nl, f))
    # starting guess: Thomas-Fermi-like screened Coulomb
    V = -Z / r * np.exp(-r * Z ** (1 / 3) / 1.5) - 1.0 / (r + 1.0) * 0  # mostly bare nucleus near r=0
    V = np.maximum(V, -Z / r)
    hist_in, hist_out, prev = [], [], {}
    for it in range(1, maxit + 1):
        eps, orbs = {}, {}
        rho = np.zeros_like(r)
        for l, lst in byl.items():
            nmax = max(n for n, _, _ in lst)
            w, u = _solve_l(r, dx, V, l, nmax - l, Z, prev.get(l))
            prev[l] = w
            for n, nl, f in lst:
                k = n - l - 1
                eps[nl], orbs[nl] = w[k], u[:, k]
                rho += f * u[:, k] ** 2 / (4 * np.pi * r * r)
        vh = _hartree(r, dx, rho)
        exc, vxc = lda_xc(rho)
        Vnew = -Z / r + vh + vxc
        err = np.sqrt(np.sum((Vnew - V) ** 2 * r**3 * rho) * dx * 4 * np.pi) if it > 1 else 1.0
        # Anderson mixing on (input, output) potentials
        hist_in.append(V.copy()); hist_out.append(Vnew.copy())
        if len(hist_in) >= 2:
            f1, f0 = hist_out[-1] - hist_in[-1], hist_out[-2] - hist_in[-2]
            df = f1 - f0
            wgt = r**3
            beta = np.sum(f1 * df * wgt) / max(np.sum(df * df * wgt), 1e-300)
            vin = hist_in[-1] - beta * (hist_in[-1] - hist_in[-2])
            vout = hist_out[-1] - beta * (hist_out[-1] - hist_out[-2])
            V = (1 - mix) * vin + mix * vout
        else:
            V = (1 - mix) * V + mix * Vnew
        hist_in, hist_out = hist_in[-2:], hist_out[-2:]
        if err < tol:
            break
    dV = 4 * np.pi * r**3 * dx
    band = sum(occ[nl] * eps[nl] for nl in occ)
    E = band - np.sum(rho * (0.5 * vh + vxc - exc) * dV)
    return AtomResult(Z, dict(occ), {k: float(v) for k, v in eps.items()}, float(E), it, r, rho, orbs)


def solve_atom_extrapolated(Z: int, dx: float = 0.004, **kw) -> AtomResult:
    """Two grids (dx, dx/2) and Richardson extrapolation of every reported number: error ~ dx^4."""
    a = solve_atom(Z, dx, **kw)
    b = solve_atom(Z, dx / 2, **kw)
    ext = lambda p, q: (4 * q - p) / 3
    eig = {k: ext(a.eigenvalues[k], b.eigenvalues[k]) for k in b.eigenvalues}
    return AtomResult(Z, b.occupations, eig, ext(a.total_energy, b.total_energy), b.iterations, b.r, b.density, b.orbitals)


# ---------------------------------------------------------------- spin-polarized (LSD)
def _vwn_g(rs, A, b, c, x0):
    Q = np.sqrt(4 * c - b * b)
    x = np.sqrt(rs)
    X = x * x + b * x + c
    X0 = x0 * x0 + b * x0 + c
    at = np.arctan(Q / (2 * x + b))
    return A * (np.log(x * x / X) + 2 * b / Q * at
                - b * x0 / X0 * (np.log((x - x0) ** 2 / X) + 2 * (b + 2 * x0) / Q * at))


def _lsd_energy_density(nu, nd):
    """Exchange-correlation energy per volume for spin densities (Slater exchange + VWN5)."""
    nu = np.maximum(nu, 1e-30); nd = np.maximum(nd, 1e-30)
    n = nu + nd
    ex = -0.75 * np.cbrt(3 / np.pi) * 2 ** (1 / 3) * (nu ** (4 / 3) + nd ** (4 / 3))
    rs = np.cbrt(3.0 / (4.0 * np.pi * n))
    z = np.clip((nu - nd) / n, -1 + 1e-14, 1 - 1e-14)
    ecp = _vwn_g(rs, 0.0310907, 3.72744, 12.9352, -0.10498)
    ecf = _vwn_g(rs, 0.01554535, 7.06042, 18.0578, -0.32500)
    alp = _vwn_g(rs, -1.0 / (6 * np.pi**2), 1.13107, 13.0045, -0.0047584)
    f = ((1 + z) ** (4 / 3) + (1 - z) ** (4 / 3) - 2) / (2 ** (4 / 3) - 2)
    f2 = 4.0 / (9.0 * (2 ** (1 / 3) - 1))
    ec = ecp + alp * f / f2 * (1 - z**4) + (ecf - ecp) * f * z**4
    return ex + n * ec


def lsd_xc(nu, nd):
    """Return (energy per volume, v_up, v_down); potentials by central differences."""
    e = _lsd_energy_density(nu, nd)
    h = 1e-4 * (nu + nd) + 1e-30
    vu = (_lsd_energy_density(nu + h, nd) - _lsd_energy_density(np.maximum(nu - h, 0), nd)) / (nu + h - np.maximum(nu - h, 0))
    vd = (_lsd_energy_density(nu, nd + h) - _lsd_energy_density(nu, np.maximum(nd - h, 0))) / (nd + h - np.maximum(nd - h, 0))
    return e, vu, vd


def hund(occ: dict) -> tuple[dict, dict]:
    """Split subshell occupations into spin-up and spin-down following Hund's first rule."""
    up, dn = {}, {}
    for nl, f in occ.items():
        cap = 2 * LETTERS.index(nl[-1]) + 1
        u = min(f, cap)
        up[nl], dn[nl] = u, f - u
    return up, dn


def solve_atom_lsd(Z: int, dx: float = 0.004, tol: float = 1e-9, mix: float = 0.3, maxit: int = 500,
                   occupations: dict | None = None) -> AtomResult:
    """Spin-polarized version of solve_atom (local spin density approximation)."""
    occ = occupations or configuration(Z)
    ou, od = hund(occ)
    x, r = _grid(Z, dx)
    V = [np.maximum(-Z / r * np.exp(-r * Z ** (1 / 3) / 1.5), -Z / r) for _ in range(2)]
    prev = {}
    hist_in, hist_out = [], []
    dV = 4 * np.pi * r**3 * dx
    for it in range(1, maxit + 1):
        eps, orbs, rho = {}, {}, [np.zeros_like(r), np.zeros_like(r)]
        band = 0.0
        for sp, o in enumerate((ou, od)):
            byl = {}
            for nl, f in o.items():
                if f > 0:
                    byl.setdefault(LETTERS.index(nl[-1]), []).append((int(nl[:-1]), nl, f))
            for l, lst in byl.items():
                nmax = max(n for n, _, _ in lst)
                w, u = _solve_l(r, dx, V[sp], l, nmax - l, Z, prev.get((sp, l)))
                prev[(sp, l)] = w
                for n, nl, f in lst:
                    k = n - l - 1
                    eps[nl + ("↑" if sp == 0 else "↓")] = float(w[k])
                    if sp == 0 or nl not in orbs:
                        orbs[nl] = u[:, k]
                    rho[sp] += f * u[:, k] ** 2 / (4 * np.pi * r * r)
                    band += f * w[k]
        vh = _hartree(r, dx, rho[0] + rho[1])
        exc, vu, vd = lsd_xc(rho[0], rho[1])
        Vn = [-Z / r + vh + vu, -Z / r + vh + vd]
        E = band - np.sum((0.5 * vh * (rho[0] + rho[1]) + vu * rho[0] + vd * rho[1] - exc) * dV)
        vin, vout = np.concatenate(V), np.concatenate(Vn)
        wgt = np.concatenate([r**3 * (rho[0] + rho[1])] * 2)
        err = np.sqrt(np.sum((vout - vin) ** 2 * wgt) * dx * 4 * np.pi)
        hist_in.append(vin); hist_out.append(vout)
        if len(hist_in) >= 2:
            f1, f0 = hist_out[-1] - hist_in[-1], hist_out[-2] - hist_in[-2]
            df = f1 - f0
            w3 = np.concatenate([r**3] * 2)
            beta = np.sum(f1 * df * w3) / max(np.sum(df * df * w3), 1e-300)
            a = hist_in[-1] - beta * (hist_in[-1] - hist_in[-2])
            b = hist_out[-1] - beta * (hist_out[-1] - hist_out[-2])
            vnew = (1 - mix) * a + mix * b
        else:
            vnew = (1 - mix) * vin + mix * vout
        hist_in, hist_out = hist_in[-2:], hist_out[-2:]
        V = [vnew[: r.size], vnew[r.size:]]
        if it > 1 and err < tol:
            break
    return AtomResult(Z, dict(occ), eps, float(E), it, r, rho[0] + rho[1], orbs)
