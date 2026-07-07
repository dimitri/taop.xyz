# Makefile — TikZ → SVG pipeline for YeSQL lesson diagrams
#
# Converts TikZ fragments from taop-courses and taop-vol-1 into SVG files
# served from static/img/diagrams/.
#
# Usage:
#   make               — build all SVGs
#   make clean         — remove generated SVGs
#   make fig-foo.svg   — build one specific diagram

SHELL    := /bin/bash
COMPILE  := ./compile.sh
OUTDIR   := ../static/img/diagrams

C1  := /Users/dim/dev/TAOP/taop-courses/1-Master-Window-Functions/figs
C2  := /Users/dim/dev/TAOP/taop-courses/2-Reliable-Aggregation/figs
C3  := /Users/dim/dev/TAOP/taop-courses/3-Data-Modeling/figs
C4  := /Users/dim/dev/TAOP/taop-courses/4-Advanced-JOINs/figs
C5  := /Users/dim/dev/TAOP/taop-courses/5-Query-Optimization/figs
C6  := /Users/dim/dev/TAOP/taop-courses/6-Read-Query-Plans/figs
B1  := /Users/dim/dev/TAOP/taop-vol-1/en/01-intro
B2  := /Users/dim/dev/TAOP/taop-vol-1/en/02-writing-sql-queries
B3  := /Users/dim/dev/TAOP/taop-vol-1/en/03-sql-select
B4  := /Users/dim/dev/TAOP/taop-vol-1/en/04-data-types
B5  := /Users/dim/dev/TAOP/taop-vol-1/en/05-data-modeling
B8  := /Users/dim/dev/TAOP/taop-vol-1/en/08-extensions

# ── Window functions ───────────────────────────────────────────────────────────
WF_SVGS := \
    $(OUTDIR)/fig-groupby-vs-window.svg \
    $(OUTDIR)/fig-window-frame-spec.svg \
    $(OUTDIR)/fig-window-frame.svg

$(OUTDIR)/fig-groupby-vs-window.svg: $(C1)/fig-groupby-vs-window.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-window-frame-spec.svg: $(C1)/fig-window-frame-spec.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-window-frame.svg: $(B1)/fig-window-frame.tex
	$(COMPILE) $< $@

# ── Aggregation ───────────────────────────────────────────────────────────────
AGG_SVGS := \
    $(OUTDIR)/fig-grouping-sets-lattice.svg \
    $(OUTDIR)/fig-aggregate-filter.svg \
    $(OUTDIR)/fig-select-order.svg

$(OUTDIR)/fig-grouping-sets-lattice.svg: $(C2)/fig-grouping-sets-lattice.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-aggregate-filter.svg: $(B3)/fig-aggregate-filter.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-select-order.svg: $(B3)/fig-select-order.tex
	$(COMPILE) $< $@

# ── Joins & relations ─────────────────────────────────────────────────────────
JOIN_SVGS := \
    $(OUTDIR)/fig-join-types.svg \
    $(OUTDIR)/fig-join-amplification.svg \
    $(OUTDIR)/fig-jfan-inner.svg \
    $(OUTDIR)/fig-jfan-left.svg \
    $(OUTDIR)/fig-jfan-right.svg \
    $(OUTDIR)/fig-jfan-full.svg \
    $(OUTDIR)/fig-lateral-flow.svg \
    $(OUTDIR)/fig-cte-pipeline.svg \
    $(OUTDIR)/fig-null-logic.svg

$(OUTDIR)/fig-join-types.svg: $(C4)/fig-join-types.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-join-amplification.svg: $(C4)/fig-join-amplification.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-jfan-inner.svg: $(C4)/fig-jfan-inner.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-jfan-left.svg: $(C4)/fig-jfan-left.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-jfan-right.svg: $(C4)/fig-jfan-right.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-jfan-full.svg: $(C4)/fig-jfan-full.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-lateral-flow.svg: $(C4)/fig-lateral-flow.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-cte-pipeline.svg: $(B3)/fig-cte-pipeline.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-null-logic.svg: $(B3)/fig-null-logic.tex
	$(COMPILE) $< $@

# ── Data modeling ─────────────────────────────────────────────────────────────
MODEL_SVGS := \
    $(OUTDIR)/fig-chinook-erd.svg \
    $(OUTDIR)/fig-f1db-erd.svg \
    $(OUTDIR)/fig-junction-erd.svg \
    $(OUTDIR)/fig-fk-actions-erd.svg \
    $(OUTDIR)/fig-normal-forms.svg \
    $(OUTDIR)/fig-tweet-normalization.svg \
    $(OUTDIR)/fig-eav-antipattern.svg

$(OUTDIR)/fig-chinook-erd.svg: $(C3)/fig-chinook-erd.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-f1db-erd.svg: $(C3)/fig-f1db-erd.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-junction-erd.svg: $(C3)/fig-junction-erd.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-fk-actions-erd.svg: $(C3)/fig-fk-actions-erd.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-normal-forms.svg: $(B5)/fig-normal-forms.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-tweet-normalization.svg: $(B5)/fig-tweet-normalization.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-eav-antipattern.svg: $(B5)/fig-eav-antipattern.tex
	$(COMPILE) $< $@

# ── Query optimization ────────────────────────────────────────────────────────
OPT_SVGS := \
    $(OUTDIR)/fig-query-pipeline.svg \
    $(OUTDIR)/fig-cost-model.svg \
    $(OUTDIR)/fig-index-types.svg \
    $(OUTDIR)/fig-optimization-workflow.svg \
    $(OUTDIR)/fig-btree-page-layout.svg

$(OUTDIR)/fig-query-pipeline.svg: $(C5)/fig-query-pipeline.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-cost-model.svg: $(C5)/fig-cost-model.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-index-types.svg: $(C5)/fig-index-types.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-optimization-workflow.svg: $(C5)/fig-optimization-workflow.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-btree-page-layout.svg: $(C3)/fig-btree-page-layout.tex
	$(COMPILE) $< $@

# ── Reading query plans ───────────────────────────────────────────────────────
PLAN_SVGS := \
    $(OUTDIR)/fig-explain-anatomy.svg \
    $(OUTDIR)/fig-plan-tree.svg \
    $(OUTDIR)/fig-node-types.svg \
    $(OUTDIR)/fig-io-patterns.svg \
    $(OUTDIR)/fig-join-operators.svg

$(OUTDIR)/fig-explain-anatomy.svg: $(C6)/fig-explain-anatomy.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-plan-tree.svg: $(C6)/fig-plan-tree.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-node-types.svg: $(C6)/fig-node-types.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-io-patterns.svg: $(C6)/fig-io-patterns.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-join-operators.svg: $(C4)/fig-join-operators.tex
	$(COMPILE) $< $@

# ── SQL foundations ───────────────────────────────────────────────────────────
FOUND_SVGS := \
    $(OUTDIR)/fig-factbook-relation.svg \
    $(OUTDIR)/fig-psql-anatomy.svg \
    $(OUTDIR)/fig-acid.svg \
    $(OUTDIR)/fig-data-access-service.svg

$(OUTDIR)/fig-factbook-relation.svg: $(B1)/fig-factbook-relation.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-psql-anatomy.svg: $(B2)/fig-psql-anatomy.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-acid.svg: $(B1)/fig-acid.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-data-access-service.svg: $(B1)/fig-data-access-service.tex
	$(COMPILE) $< $@

# ── Data types ────────────────────────────────────────────────────────────────
TYPE_SVGS := \
    $(OUTDIR)/fig-numeric-types.svg \
    $(OUTDIR)/fig-range-operators.svg \
    $(OUTDIR)/fig-jsonb-operators.svg \
    $(OUTDIR)/fig-document-vs-relational.svg

$(OUTDIR)/fig-numeric-types.svg: $(B4)/fig-numeric-types.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-range-operators.svg: $(B4)/fig-range-operators.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-jsonb-operators.svg: $(B4)/fig-jsonb-operators.tex
	$(COMPILE) $< $@

$(OUTDIR)/fig-document-vs-relational.svg: $(C3)/fig-document-vs-relational.tex
	$(COMPILE) $< $@

# ── All targets ───────────────────────────────────────────────────────────────
ALL_SVGS := \
    $(WF_SVGS) $(AGG_SVGS) $(JOIN_SVGS) \
    $(MODEL_SVGS) $(OPT_SVGS) $(PLAN_SVGS) \
    $(FOUND_SVGS) $(TYPE_SVGS)

.PHONY: all clean wf agg joins modeling opt plans foundations types

all: $(ALL_SVGS)

wf:          $(WF_SVGS)
agg:         $(AGG_SVGS)
joins:       $(JOIN_SVGS)
modeling:    $(MODEL_SVGS)
opt:         $(OPT_SVGS)
plans:       $(PLAN_SVGS)
foundations: $(FOUND_SVGS)
types:       $(TYPE_SVGS)

clean:
	rm -f $(ALL_SVGS)
