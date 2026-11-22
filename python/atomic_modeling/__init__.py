"""Atomic Modeling: the Python side of the project.

- radial:  all-electron LDA atoms on a radial grid, checked against NIST reference tables
- grid3d:  3D Schrodinger solver (FFT split-operator) that runs on CUDA through CuPy when
           an NVIDIA GPU is available, and on NumPy otherwise
- export:  writes the data files the web app loads
"""
from .backend import xp, backend_name, to_numpy  # noqa: F401
