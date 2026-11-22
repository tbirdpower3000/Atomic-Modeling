"""Array backend: CuPy on an NVIDIA GPU (CUDA) when available, NumPy otherwise.

Force one with the environment variable ATOMIC_BACKEND=numpy or ATOMIC_BACKEND=cupy.
Install the CUDA backend with:  pip install cupy-cuda12x   (match your CUDA major version).
"""
from __future__ import annotations
import os
import numpy as np

_want = os.environ.get("ATOMIC_BACKEND", "auto").lower()
xp = np
backend_name = "numpy (CPU)"
if _want in ("auto", "cupy", "cuda"):
    try:
        import cupy as _cp
        if _cp.cuda.runtime.getDeviceCount() > 0:
            xp = _cp
            _dev = _cp.cuda.Device(0)
            try:
                _nm = _cp.cuda.runtime.getDeviceProperties(_dev.id)["name"].decode()
            except Exception:
                _nm = "GPU 0"
            backend_name = f"cupy (CUDA: {_nm}, {_dev.mem_info[1] / 2**30:.0f} GB)"
    except Exception as _e:  # cupy missing or no usable GPU
        if _want in ("cupy", "cuda"):
            raise RuntimeError(f"ATOMIC_BACKEND={_want} requested but CuPy/CUDA is not usable: {_e}") from _e


def to_numpy(a):
    """Bring an array back to host memory (no-op on NumPy)."""
    return a.get() if hasattr(a, "get") else np.asarray(a)


def sync():
    """Wait for queued GPU work to finish, so timings are honest."""
    if xp is not np:
        xp.cuda.Stream.null.synchronize()
