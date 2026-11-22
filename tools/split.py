#!/usr/bin/env python3
"""Split index.html into the source files under src/ (run after editing index.html directly)."""
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# (file name, text that starts the part: must be at the start of a line inside the script)
PARTS = [
    ("00-core.js", None),
    ("10-scene-orbitals.js", "const cv=$('#cv'),fig=$('#fig');"),
    ("20-element-data.js", "const SYM='H He Li"),
    ("21-periodic-table.js", "const PI={"),
    ("30-isotope-data.js", "const ISO=[["),
    ("31-nuclide-chart.js", "let NVW=null,ISL=null;"),
    ("32-stability.js", "const STP={"),
    ("40-element-card.js", "function showEl(Z){"),
    ("50-particles.js", "const SM=["),
    ("60-nucleus.js", "function buildNuc(){"),
    ("61-transmutation.js", "const MOVES=[["),
    ("70-gpu-solver.js", "const GS={"),
    ("71-monte-carlo.js", "/* ---- Quantum Monte Carlo"),
    ("80-modes.js", "function setMode(md){"),
    ("81-spectra-export-share.js", "/* ---- spectra ---- */"),
]


def main():
    s = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    a, b = s.index("<style>\n") + 8, s.index("</style>")
    css = s[a:b]
    s2 = s[:a] + "/*STYLES*/" + s[b:]
    a, b = s2.index("<script>\n{\n") + 11, s2.rindex("}\n</script>")
    js = s2[a:b]
    page = s2[:a] + "/*SCRIPT*/" + s2[b:]
    cuts = [0]
    for name, start in PARTS[1:]:
        i = js.find("\n" + start)
        if i < 0 or js.count("\n" + start) != 1:
            sys.exit(f"marker for {name} not found exactly once: {start!r}")
        cuts.append(i + 1)
    if cuts != sorted(cuts):
        sys.exit("markers are out of order")
    cuts.append(len(js))
    out = os.path.join(ROOT, "src")
    os.makedirs(os.path.join(out, "js"), exist_ok=True)
    for old in os.listdir(os.path.join(out, "js")):
        os.remove(os.path.join(out, "js", old))
    for (name, _), i, j in zip(PARTS, cuts, cuts[1:]):
        open(os.path.join(out, "js", name), "w", encoding="utf-8").write(js[i:j])
    open(os.path.join(out, "styles.css"), "w", encoding="utf-8").write(css)
    open(os.path.join(out, "page.html"), "w", encoding="utf-8").write(page)
    print(f"wrote src/page.html, src/styles.css and {len(PARTS)} files in src/js/")


if __name__ == "__main__":
    main()
