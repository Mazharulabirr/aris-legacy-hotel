# -*- coding: utf-8 -*-
"""Rebuild the single-file bundle's inlined CSS and JS from the source files.

aris-legacy-site-single-file.html carries its own copy of assets/css/style.css
and assets/js/main.js. Nothing regenerates them, so edit the source files and
run this; hand-patching the inlined copies is how the two drift apart.

    py resync-bundle.py

Leaves the ARIS_IMG image map, the page markup and the hash router untouched.
"""
import io
import sys

BUNDLE = "aris-legacy-site-single-file.html"
ROUTING = "/* --- single-page bundle: routing --- */"


def main():
    sf = io.open(BUNDLE, encoding="utf-8", newline="").read()
    css = io.open("assets/css/style.css", encoding="utf-8", newline="").read().replace("\r\n", "\n")
    js = io.open("assets/js/main.js", encoding="utf-8", newline="").read().replace("\r\n", "\n")

    # <style> = the stylesheet, then the routing rules only the bundle needs
    a = sf.index("<style>") + len("<style>")
    b = sf.index("</style>")
    routing = sf[a:b]
    if ROUTING not in routing:
        sys.exit("routing block missing from the bundle's <style>")
    routing = routing[routing.index(ROUTING):].rstrip("\n")
    sf = sf[:a] + "\n" + css.rstrip("\n") + "\n\n" + routing + "\n" + sf[b:]

    # the second of three <script> blocks is main.js verbatim
    opens, p = [], 0
    while True:
        p = sf.find("<script>", p)
        if p < 0:
            break
        opens.append(p)
        p += len("<script>")
    if len(opens) != 3:
        sys.exit("expected 3 <script> blocks, found %d" % len(opens))
    s0 = opens[1] + len("<script>")
    s1 = sf.index("</script>", s0)
    sf = sf[:s0] + "\n" + js.rstrip("\n") + "\n" + sf[s1:]

    io.open(BUNDLE, "w", encoding="utf-8", newline="").write(sf)
    print("resynced %s  (css %d chars, js %d chars)" % (BUNDLE, len(css), len(js)))


main()
