#!/usr/bin/env bash
# Usage: compile.sh <source.tex> <output.svg>
# Extracts the tikzpicture block from a TikZ fragment, wraps it in a
# standalone document, compiles to PDF, converts to SVG.
# Handles both course-style (resizebox wrapper) and book-style
# (figure env + adjustbox) fragments.
set -euo pipefail

SRC="$(realpath "$1")"
OUT_DIR="$(realpath "$(dirname "$2")")"
OUT="$OUT_DIR/$(basename "$2")"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

# Extract the tikzpicture block from the source (strip all outer wrappers)
python3 - "$SRC" > "$TMPDIR/content.tex" << 'PYEOF'
import sys, re

text = open(sys.argv[1]).read()

# Match from \begin{tikzpicture} (with any optional args) to \end{tikzpicture}
m = re.search(
    r'(\\begin\{tikzpicture\}.*?\\end\{tikzpicture\})',
    text,
    re.DOTALL
)
if not m:
    print("ERROR: no tikzpicture found", file=sys.stderr)
    sys.exit(1)

print(m.group(1))
PYEOF

cat > "$TMPDIR/wrapper.tex" << 'LATEX'
\documentclass[border=10pt]{standalone}
\usepackage{amsmath,amssymb}
\usepackage[svgnames]{xcolor}
\usepackage{tikz}
\usetikzlibrary{arrows.meta,positioning,matrix,calc,shapes.geometric,shapes.misc,fit,backgrounds,patterns,decorations.pathreplacing}
\usepackage{fontawesome5}
\begin{document}
\input{content.tex}
\end{document}
LATEX

cd "$TMPDIR"
pdflatex -interaction=nonstopmode -halt-on-error wrapper.tex > wrapper.log 2>&1 || {
    echo "ERROR: pdflatex failed for $SRC" >&2
    grep -E "^!|^l\.|Error|Undefined" wrapper.log | head -20 >&2
    exit 1
}

pdf2svg wrapper.pdf "$OUT"
echo "  OK: $(basename "$OUT")"
