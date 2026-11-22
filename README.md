# Atomic Modeling

*Orbitals in your compass*

**Live app:** it runs at **[https://tbirdpower3000.github.io/Atomic-Modeling/](https://tbirdpower3000.github.io/Atomic-Modeling/)** (GitHub Pages, served from the `main` branch).

An interactive 3D atom explorer that grew out of a hand-drawn compass construction: a 32-ray rosette (11.25° steps) with a square and circles of radius 4 and 5.7. That drawing became the frame for hydrogen orbitals and grew from there.

Open `index.html` in a modern browser (WebGL 2 needed for the GPU features). It loads `nuclear.json` from the same folder, so serve the folder over HTTP rather than opening the file directly:

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What it does

- **Orbitals:** exact hydrogen-like wavefunctions as shapes, dot clouds and GPU ray-marched volumes; muons and other exotic particles via reduced mass.
- **Periodic table:** trends, colour-graded properties, shell sizes from Slater's rules (normalized to carbon), temperature / pressure / gravity sliders with critical points, gap-filling of missing data with its measured error.
- **Isotopes and nuclei:** isotope selector, chart of nuclides, stable-isotope map, a tunable stability experiment, Woods–Saxon nucleus with shell-model nucleon orbitals.
- **Transmutation lab:** cheapest routes between nuclides (e.g. lead → gold, americium → moscovium), energies in eV, J, cal or kJ/mol, and a Gold = 1 scale.
- **Solve on GPU:** WebGL 2 solver for the Schrödinger equation on 64³/128³ grids (ground and excited states, real-time evolution, many-electron mean field with the Latter tail), with 64³ → 128³ upscaling and Richardson extrapolation.
- **Monte Carlo electrons:** variational and diffusion Monte Carlo for He, Li and Be, with live error bars and ionization energies.
- **Fundamental particles:** quarks, leptons, what is inside a nucleon, and a particle-detector simulation.
- **Spectrum:** measured emission lines, and exact lines for one-electron ions with isotope shifts.

## Python and CUDA

The careful math lives in [`python/`](python/README.md):

- **Radial atoms:** an all-electron density-functional solver for hydrogen to krypton, checked against the NIST reference tables. It writes `data/radial_atoms.json`, which the web app uses for computed ionization energies.
- **3D solver on CUDA:** an FFT Schrödinger solver that runs on an NVIDIA GPU through CuPy, and on NumPy everywhere else. Run `python -m atomic_modeling.grid3d 64 128 256` to benchmark it.

## Accuracy checks

| Test | Result | Reference |
|---|---|---|
| Hydrogen 1s, GPU 128³ | −13.4 eV | −13.6 eV |
| He total energy, DMC | −2.9028 ± 0.0018 Ha | −2.9037 Ha |
| Li total energy, DMC | −7.4834 ± 0.0033 Ha | −7.4781 Ha |
| Li ionization energy, DMC | 5.40 ± 0.14 eV | 5.39 eV |
| Mass formula fit (2,359 nuclides) | rms 2.35 MeV | AME masses |
| Krypton LDA total energy, Python radial solver | −2750.1488 Ha | −2750.1479 Ha (NIST) |
| Ionization energies H–Kr, spin-polarized DFT, E(ion) − E(atom) | mean error 0.30 eV (0.77 eV without spin) | NIST measured values |
| Oxygen LSD total energy, Python radial solver | −74.52743 Ha | −74.527410 Ha (NIST) |
| Hydrogen 256³ on an RTX 3060 (in the browser) | −13.5 eV in 20 s | −13.6 eV |

`npm test` reruns the Monte Carlo and browser checks.

## Trust labels

Every number in the app carries one of four labels: **Measured** (from experiment), **Exact** (solved from the equations), **Computed** (calculated here, with a known error) or **Rough guess** (a simple model).

## Data sources

- **Half-lives, decay modes, spins:** NUBASE2020. F.G. Kondev, M. Wang, W.J. Huang, S. Naimi, G. Audi, *Chin. Phys. C* **45**, 030001 (2021). The app's 3,084 isotopes were checked against the NUBASE2020 file: no differences.
- **Nuclear masses and binding energies:** AME2020. M. Wang, W.J. Huang, F.G. Kondev, G. Audi, S. Naimi, *Chin. Phys. C* **45**, 030003 (2021).
- **Element properties:** the [mendeleev](https://github.com/lmmentel/mendeleev) database (NIST, CRC Handbook, Pyykkö radii).
- **Spectral lines:** strongest visible lines from the NIST Atomic Spectra Database (a short reference list per element).
- **Atomic reference energies:** NIST Atomic Reference Data for Electronic Structure Calculations; exact non-relativistic energies for He, Li, Be.

## Share and export

- **Copy link to this view:** the address stores the element, isotope, orbital, view, colouring and units, e.g. `#z=11&mode=cloud&n=3&l=0&m=0`.
- **Save picture**, **Elements (CSV)**, **Isotopes (CSV)**.
- **Download state (.cube)** from the solver, for VESTA or 3Dmol; **Download results (JSON)** from Monte Carlo.

## Development

The app ships as one file, `index.html`, built from the parts in `src/` (page, styles, and 15 script files that share one scope; they are not yet independent ES modules).

```
python3 tools/build.py          # src/ -> index.html
python3 tools/split.py          # index.html -> src/ (after editing index.html directly)
npm install && npm test         # build check, Monte Carlo check, browser tests
cd python && python -m pytest   # NIST and analytic checks
```

GitHub Actions runs both test suites on every push and pull request.

## Roadmap

From a literature search: radial-grid SCF validated against the NIST DFT atomic reference tables, spin-polarized LDA with correlation, FRDM2012 masses and deformations, IAEA LiveChart data, TENDL cross-sections for reaction yields, emission spectra, and a WebGPU compute backend.
