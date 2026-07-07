# Produces PNG figures for the "What is an SQL Relation?" lesson.
#
# TikZ sources live in taop-courses; this Makefile compiles them via
# TEXINPUTS so the standalone wrappers can use plain \input{filename.tex}.
# PNGs are written one directory up (the page bundle root) so Hugo serves
# them at the same URL path as index.md.
#
# Usage:
#   make           — build all PNGs
#   make clean     — remove intermediates (PDFs, aux files)
#   make distclean — also remove the generated PNGs

COURSES  ?= /Users/dim/dev/TAOP/taop-courses
FIGS_SRC := $(COURSES)/4-Advanced-JOINs/figs
OUTDIR   := ..
DPI      := 150

PDFLATEX  = TEXINPUTS=$(FIGS_SRC): pdflatex -interaction=nonstopmode

TARGETS = \
	$(OUTDIR)/fig-join-operators.png \
	$(OUTDIR)/fig-join-types-book.png \
	$(OUTDIR)/fig-set-operators.png

.PHONY: all clean distclean

all: $(TARGETS)

$(OUTDIR)/fig-join-operators.png: fig-join-operators-standalone.tex $(FIGS_SRC)/fig-join-operators.tex
	$(PDFLATEX) fig-join-operators-standalone
	pdftoppm -r $(DPI) -png -singlefile fig-join-operators-standalone.pdf $(OUTDIR)/fig-join-operators

$(OUTDIR)/fig-join-types-book.png: fig-join-types-book-standalone.tex $(FIGS_SRC)/fig-join-types-book.tex
	$(PDFLATEX) fig-join-types-book-standalone
	pdftoppm -r $(DPI) -png -singlefile fig-join-types-book-standalone.pdf $(OUTDIR)/fig-join-types-book

$(OUTDIR)/fig-set-operators.png: fig-set-operators-standalone.tex $(FIGS_SRC)/fig-set-operators.tex
	$(PDFLATEX) fig-set-operators-standalone
	pdftoppm -r $(DPI) -png -singlefile fig-set-operators-standalone.pdf $(OUTDIR)/fig-set-operators

clean:
	rm -f *.pdf *.aux *.log *.synctex.gz

distclean: clean
	rm -f $(OUTDIR)/fig-join-operators.png $(OUTDIR)/fig-join-types-book.png $(OUTDIR)/fig-set-operators.png
