# YeSQL — the evergreen learning hub (replaces /blog)

Codename: **yesql** (alt favorite: `codex`). Section root: `/yesql/`.

Title: **YeSQL**
Subtitle: *Practical PostgreSQL for developers, one concept at a time.*

A topic-organized, evergreen learning library — not a dated blog. Pillar →
concept → lesson, with pgPedia-style cross-links and "from the book, chapter X"
attribution. Each surface routes to the closest next step (newsletter → book →
course).

---

## Taxonomy v2 — chapter-derived, consolidated

The book has 52 chapters across 7 parts. We do **not** use the 7 part titles as
the taxonomy (too coarse) nor all 52 chapters (too many, and many are
book-scaffolding or interviews). Instead: **8 categories** (Tier 2 concept
clusters) consolidated from the teaching chapters, with **chapter titles as the
Tier-3 lesson titles**.

### Hard filter — excluded from the hub
- All 6 interviews (ch 10, 20, 26, 34, 42, 52) — possible future "Conversations".
- Book scaffolding/meta: ch 3 Software Architecture, 4 Getting Ready, 6 A Small
  Application, 11 Get Some Data, 35 Another Small Application, duplicate
  "Structured Query Language" (ch 2 vs 12), 28 Tooling for DB Modeling, 45 Last.fm,
  25 (dup of 43).

### The 8 categories (slug — title — source chapters)

| # | slug | title | book chapters folded in |
|---|------|-------|--------------------------|
| 1 | `sql-foundations`     | SQL Foundations          | 2/12 What is SQL, 13 Queries: DML/DDL/TCL/DCL, 22 Some Relational Theory |
| 2 | `querying-data`       | Querying Data            | 14 SELECT/FROM/WHERE, 15 ORDER BY/LIMIT, 16 GROUP BY/HAVING/WITH/UNION, 17 NULLs, 18 Window Functions, 19 Relations & Joins |
| 3 | `writing-sql`         | Writing SQL Well         | 5 Business Logic, 7 The psql REPL, 8 SQL is Code |
| 4 | `indexing-performance`| Indexing & Performance   | 9 Indexing Strategy (+ EXPLAIN / the PEV tool) |
| 5 | `data-types`          | Data Types               | 21 Serialization, 23 PostgreSQL Data Types, 24 Denormalized (JSON) Types |
| 6 | `data-modeling`       | Data Modeling            | 27 ORM, 29 Normalization, 30 Geonames use case, 31 Anti-Patterns, 32 Denormalization, 33 Not Only SQL |
| 7 | `concurrency`         | Concurrency & Data Changes | 36 INSERT/UPDATE/DELETE, 37 Isolation & Locking, 38 Computing & Caching, 39 Triggers, 40 LISTEN/NOTIFY, 41 Batch Update (MoMA) |
| 8 | `extensions-spatial`  | Extensions & PostGIS     | 43 What's an extension, 44 hstore auditing, 46 trigrams, 47 intarray tags, 51 HyperLogLog, 48 pub names, 49 nearest pub (KNN), 50 Geolocation |

Tags (cross-cutting keyword layer, pgPedia-style): `LATERAL`, `GROUPING SETS`,
`percentile_cont`, `WITH RECURSIVE`, `GiST`, `FILTER`, `window-frame`, `psql`,
`PostGIS`, `JSON`, `EXPLAIN`, …

---

## Launch set (hard-filtered, 12 lessons)

Zero-risk content already public, mapped onto the taxonomy.

**From the 6 lab starter-kit queries** (`TheArtOfPostgreSQL/starter-kit/`):
- Nested LATERAL joins → `querying-data`
- GROUPING SETS + FILTER → `querying-data`
- percentile_cont() → `querying-data`
- k-Nearest-Neighbour search → `extensions-spatial`
- A map with no graphics library → `extensions-spatial`
- WITH RECURSIVE (rivers) → `querying-data`

**From the 6 evergreen 2019 posts** (refreshed, dates dropped):
- How to Learn SQL → `sql-foundations`
- What is an SQL relation? → `sql-foundations`
- What is an SQL JOIN? → `querying-data`
- SQL Aggregates → `querying-data`
- The R in ORM → `data-modeling`
- Why Postgres? → `sql-foundations`

---

## Page tiers & templates

- **Tier 1 hub** `/yesql/` — `content/yesql/_index.md` (`layout = "hub"`) →
  `layouts/yesql/hub.html`. Hero + 8 category cards + offer.
- **Tier 2 concept** `/yesql/<cat>/` — `content/yesql/<cat>/_index.md` →
  `layouts/yesql/list.html`. Concept overview + lesson list + contextual offer.
- **Tier 3 lesson** `/yesql/<cat>/<slug>/` — a regular `.md` →
  `layouts/yesql/single.html`. Lesson + book attribution + sidebar + offer.

Shared: `partials/yesql/head.html` (page-aware, modern shell), modern
`partials/header.html` (sticky CTA), `partials/yesql/offer.html` (contextual CTA).

## How much of the book to give away
Free = "what it is, why it matters, one worked example." Paid = full chapter,
all variations, the end-to-end use cases, interviews, datasets. Every free lesson
is complete as a teaching unit and ends pointing at the chapter it's drawn from.
The lab starter-kit tone is the template.

## Migration / SEO
Old posts live at `/blog/:year/:month/:slug/` (date baked into URL). New URLs are
`/yesql/<cat>/<slug>/`, dateless. **301-redirect all 11 old URLs** before launch.
Keep a small dated "What's New" sub-feed for release notes / conf recaps / promos.
