# Atomic Modeling

*Orbitals in your compass*

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
- **Fundamental particles:** quarks, leptons and what is inside a nucleon.

## Accuracy checks

| Test | Result | Reference |
|---|---|---|
| Hydrogen 1s, GPU 128³ | −13.4 eV | −13.6 eV |
| He total energy, DMC | −2.9028 ± 0.0018 Ha | −2.9037 Ha |
| Li total energy, DMC | −7.4834 ± 0.0033 Ha | −7.4781 Ha |
| Li ionization energy, DMC | 5.40 ± 0.14 eV | 5.39 eV |
| Mass formula fit (2,359 nuclides) | rms 2.35 MeV | AME masses |

`node tests/qmc.test.js` reruns the Monte Carlo checks.

## Data sources

Element properties from the [mendeleev](https://github.com/lmmentel/mendeleev) database; nuclear binding and separation energies from atomic mass evaluation data; exact atomic energies from the non-relativistic literature values.

## Roadmap

From a literature search: radial-grid SCF validated against the NIST DFT atomic reference tables, spin-polarized LDA with correlation, FRDM2012 masses and deformations, IAEA LiveChart data, TENDL cross-sections for reaction yields, emission spectra, and a WebGPU compute backend.
