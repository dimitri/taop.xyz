# YeSQL — Session Handoff & Implementation Status

> Working branch: **`yesql`**. Status as of 2026-06-18.
> Companion docs: [`YESQL.md`](YESQL.md) is the strategy/taxonomy plan; this file
> is the operational handoff — what exists, how to run it, how to add to it, and
> what's left. Read both before continuing.

---

## 1. What this branch is

A replacement for the stale 2019 `/blog` with **YeSQL**, an evergreen,
topic-organized PostgreSQL learning hub. Tagline: *"Practical PostgreSQL for
developers, one concept at a time."* Each lesson teaches a single concept with a
runnable query, attributes the source book chapter or course, and routes the reader
to the next step (newsletter → book → course). It lives at `/yesql/` and reuses
the modern 2026 site design (purple gradient shell, sticky "Get the Book – $89" CTA).

The old blog at `content/blog/` has been **retired** — Hugo alias redirects from
all 11 old `/blog/...` URLs are live. The `content/blog/` directory can be deleted
(or already has been — see TODO below).

---

## 2. Run & build

Hugo **0.162.1** (system Homebrew install on ARM). Docker pinned to 0.83.1 but
the Docker/Rosetta build fails on this machine — use Hugo directly.

```bash
hugo server                 # live dev server at http://localhost:1313/yesql/
hugo --minify               # render static site into ./docs (the publishDir)
make serve PORT=1314        # Docker fallback (may fail on ARM with Rosetta error)
```

**Config fix applied:** `[ignoreErrors]` section was malformed TOML (pre-existing).
Replaced with `ignoreLogs = [""]` at the top level. Hugo 0.162+ is now happy.

A clean build produces **325 pages, 130 aliases**, exit 0.

---

## 3. Taxonomy — 11 categories (revised from 8)

The original 8-category taxonomy was derived from the book. It has been expanded
to 11 categories so each of the 6 courses under `/Users/dim/dev/TAOP/taop-courses/`
has a dedicated home in the hub.

| # | Slug | Title | Weight | Course |
|---|------|--------|--------|--------|
| 1 | `sql-foundations` | SQL Foundations | 1 | — |
| 2 | `window-functions` | Window Functions | 2 | Course 1 |
| 3 | `aggregation` | Aggregation | 3 | Course 2 |
| 4 | `joins-and-relations` | Joins & Relations | 4 | Course 4 |
| 5 | `query-optimization` | Query Optimization | 5 | Course 5 |
| 6 | `reading-query-plans` | Reading Query Plans | 6 | Course 6 |
| 7 | `data-modeling` | Data Modeling | 7 | Course 3 |
| 8 | `writing-sql` | Writing SQL Well | 8 | — |
| 9 | `data-types` | Data Types | 9 | — |
| 10 | `concurrency` | Concurrency & Data Changes | 10 | — |
| 11 | `extensions-spatial` | Extensions & PostGIS | 11 | — |

**Dropped:** `querying-data` and `indexing-performance` — split into the above.
YeSQL was not yet published, so no redirect aliases were needed for those category
pages.

---

## 4. Repo map (what was added in this session)

```
YESQL-HANDOFF.md                  this file (updated)

# New category _index.md files:
content/yesql/window-functions/_index.md
content/yesql/aggregation/_index.md
content/yesql/joins-and-relations/_index.md
content/yesql/query-optimization/_index.md
content/yesql/reading-query-plans/_index.md

# Moved lessons (from querying-data/ → aggregation/ or joins-and-relations/):
content/yesql/aggregation/sql-aggregates.md
content/yesql/aggregation/grouping-sets-and-filter.md
content/yesql/aggregation/percentiles-in-one-query.md
content/yesql/joins-and-relations/what-is-a-join.md
content/yesql/joins-and-relations/with-recursive.md
content/yesql/joins-and-relations/nested-lateral-joins.md

# Moved lessons (from indexing-performance/ → query-optimization/ or reading-query-plans/):
content/yesql/query-optimization/indexing-strategy.md
content/yesql/query-optimization/postgresql-index-types.md
content/yesql/reading-query-plans/reading-explain.md

# New course-teaser lessons (2 per course):
content/yesql/window-functions/over-clause-mental-model.md
content/yesql/window-functions/row-number-rank-dense-rank.md
content/yesql/aggregation/where-vs-having.md
content/yesql/aggregation/filter-clause.md
content/yesql/data-modeling/update-anomaly.md
content/yesql/data-modeling/fk-constraints-trust.md
content/yesql/joins-and-relations/join-output-cardinality.md
content/yesql/joins-and-relations/lateral-join-top-n.md
content/yesql/query-optimization/planner-cost-model.md
content/yesql/query-optimization/predicate-pushdown.md
content/yesql/reading-query-plans/explain-analyze-anatomy.md
content/yesql/reading-query-plans/hash-join-nested-loop.md

# Previously missing data-types lessons (now written):
content/yesql/data-types/a-tour-of-postgresql-data-types.md
content/yesql/data-types/json-and-denormalized-types.md

# Template changes:
layouts/yesql/hub.html          course badge on category cards
layouts/yesql/list.html         course promo block above lesson list
layouts/yesql/single.html       course attribution block after book attribution

# CSS additions (appended to):
static/css/yesql.css            .yesql_course_badge, .category_course_promo,
                                .lesson_course_attr, mobile padding-top fix

# Config fix:
config.toml                     [ignoreErrors] section → ignoreLogs = [""]
```

---

## 5. Authoring a lesson (conventions — unchanged)

Front matter is TOML between `+++`:

```toml
+++
title = "What is an SQL Aggregate?"
weight = 20
summary = "One sentence; shown on the category card and meta description."
tags = ["SQL", "Aggregate", "GROUP BY"]
book_chapter = "Chapter 15, Group By, Having, With, Union All"

# For course-derived lessons, add:
course_title = "Reliable Aggregation"
course_url = "/course/reliable-aggregation/"

# Optional CTA overrides (default offer = the book):
# cta_eyebrow / cta_title / cta_body / cta_url / cta_label
+++
```

Rules:
- **Voice:** first-person, direct, opinionated, addresses "you" the app developer.
- **Length:** ~300–500 words. Free = "what it is, why it matters, ONE worked
  example." Distill — do not reproduce whole book or course chapters.
- **No hard CTA in the body.** `single.html` auto-renders the book-attribution
  box (from `book_chapter`), the course attribution box (from `course_title`),
  and the offer card. End with a light forward-pointer or internal cross-link.
- **Code fences:** ` ```sql ` for queries. **Plain ` ``` `** for psql output,
  EXPLAIN plans, ASCII tables — dark terminal block.
- **Cross-links** are root-relative: `/yesql/<cat>/<slug>/`.

For course-category pages (`_index.md`), also set:
```toml
course_title = "Course Name"
course_url = "/course/course-slug/"
```
This drives the hub card badge and the category-page promo block automatically.

---

## 6. Current state — lessons per category

| Category | # | Lessons |
|---|---|---|
| sql-foundations | 3 | how-to-learn-sql, what-is-a-relation, why-postgres |
| window-functions | 2 | over-clause-mental-model, row-number-rank-dense-rank |
| aggregation | 5 | what-is-an-sql-aggregate, grouping-sets-and-filter, percentiles-in-one-query, where-vs-having, filter-clause |
| joins-and-relations | 5 | what-is-a-join, with-recursive, nested-lateral-joins, join-output-cardinality, lateral-join-top-n |
| query-optimization | 4 | indexing-strategy, postgresql-index-types, planner-cost-model, predicate-pushdown |
| reading-query-plans | 3 | reading-explain, explain-analyze-anatomy, hash-join-nested-loop |
| data-modeling | 3 | the-r-in-orm, update-anomaly, fk-constraints-trust |
| writing-sql | 3 | sql-is-code, business-logic-in-sql, the-psql-repl |
| data-types | 3 | serialization-and-deserialization, a-tour-of-postgresql-data-types, json-and-denormalized-types |
| concurrency | 4 | insert-update-delete, isolation-and-locking, triggers, listen-notify |
| extensions-spatial | 2 | knn-search, map-as-text |

**Total: 37 lessons** across 11 categories.

---

## 7. TODO / open items (next session)

1. **Delete `content/blog/`** — blog redirect aliases are live. The old files
   can now be removed: `rm -rf content/blog/`. (Permission was denied during
   this session — do it from the shell.)

2. **Wire up course URLs** — the `course_url` values in category `_index.md`
   files point to `/course/master-window-functions/` etc. These need real
   destination pages in `content/course/`. Until then the links land on the
   course section index or 404. Either create stub course pages or temporarily
   point `course_url` to the book sales page.

3. **Review book-distilled lessons for voice/accuracy** — `writing-sql`,
   `concurrency`, and `reading-query-plans/reading-explain.md` were drafted by
   agents from book source. Verify the EXPLAIN content in `reading-explain.md`
   especially — it was flagged in the previous handoff as drawn partly from
   general PostgreSQL knowledge where the source chapter was thin.

4. **Mobile header clearance** — `body.yesql { padding-top: 130px }` at 600px
   breakpoint is a starting estimate. Verify on a real narrow viewport and
   adjust if needed.

5. **Confirm blog redirect slugs** — the blog filenames were like
   `2019-09-SQL-relations.md`, generating the slug `2019-09-sql-relations`.
   Hugo aliases were set to match. Quick check: confirm `/blog/2019-09-sql-relations/`
   redirects correctly (the alias was set to that path in `what-is-a-relation.md`).

6. **Review new course-teaser lessons** — the 12 lessons written this session
   are tight distillations from the course READMEs and SQL files. Review for
   voice (should match the established first-person, developer-direct tone)
   and for technical accuracy against the actual course material.

---

## 8. Content source repos (for reuse)

Siblings of this repo under `/Users/dim/dev/TAOP/`:
- `taop-vol-1/` — **book source** (`en/<part>/<section>.md`). Distill, don't copy.
- `TheArtOfPostgreSQL/` — **public lab / starter-kit**. Already public — safe to reuse.
- `taop-courses/` — **6 courses** (README.md + sql/*.sql per course). Distill
  key concepts into 300–500 word lessons with one worked SQL example.
  - `1-Master-Window-Functions/` → `window-functions/`
  - `2-Reliable-Aggregation/` → `aggregation/`
  - `3-Data-Modeling/` → `data-modeling/`
  - `4-Advanced-JOINs/` → `joins-and-relations/`
  - `5-Query-Optimization/` → `query-optimization/`
  - `6-Read-Query-Plans/` → `reading-query-plans/`
