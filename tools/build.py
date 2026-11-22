#!/usr/bin/env python3
"""Build index.html from src/.   python tools/build.py          writes index.html
                                 python tools/build.py --check  fails if index.html is out of date"""
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def build() -> str:
    src = os.path.join(ROOT, "src")
    page = open(os.path.join(src, "page.html"), encoding="utf-8").read()
    css = open(os.path.join(src, "styles.css"), encoding="utf-8").read()
    js = "".join(open(os.path.join(src, "js", f), encoding="utf-8").read() for f in sorted(os.listdir(os.path.join(src, "js"))))
    assert page.count("/*STYLES*/") == 1 and page.count("/*SCRIPT*/") == 1
    return page.replace("/*STYLES*/", css).replace("/*SCRIPT*/", js)


if __name__ == "__main__":
    out, path = build(), os.path.join(ROOT, "index.html")
    if "--check" in sys.argv:
        if open(path, encoding="utf-8").read() != out:
            sys.exit("index.html does not match src/. Run: python tools/build.py")
        print("index.html matches src/")
    else:
        open(path, "w", encoding="utf-8").write(out)
        print(f"wrote index.html ({len(out) // 1024} KB)")
