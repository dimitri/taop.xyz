# YeSQL — Session Handoff & Implementation Status

> Working branch: **`yesql`**. Status as of 2026-06-17.
> Companion docs: [`YESQL.md`](YESQL.md) is the strategy/taxonomy plan; this file
> is the operational handoff — what exists, how to run it, how to add to it, and
> what's left. Read both before continuing.

---

## 1. What this branch is

A replacement for the stale 2019 `/blog` with **YeSQL**, an evergreen,
topic-organized PostgreSQL learning hub. Tagline: *"Practical PostgreSQL for
developers, one concept at a time."* Each lesson teaches a single concept with a
runnable query, attributes the source book chapter, and routes the reader to the
next step (newsletter → book → course). It lives at `/yesql/` and reuses the
modern 2026 site design (purple gradient shell, sticky "Get the Book – $89" CTA).

The old blog content under `content/blog/` is **untouched and still builds** — it
has not been retired yet (see TODO).

---

## 2. Run & build

Hugo **0.83.1 extended** (pinned; matches the site). Docker + Makefile added.

```bash
make serve            # build image (if needed) + live dev server, bind-mounted
                      # browse http://localhost:1313/yesql/
make serve PORT=1314  # use another host port (see caveat below)
make build            # render static site into ./docs (the publishDir)
make stop             # stop the dev container
make help             # list targets
```

Caveats:
- **Port 1313 may already be taken** by a pre-existing `tapouehorg-hugo-1`
  container on this machine. Either `docker stop tapouehorg-hugo-1` first, or run
  `make serve PORT=1314`.
- **Live-reload is unreliable across the macOS bind mount on this old Hugo.**
  After editing templates or CSS, `make stop && make serve` (or
  `docker restart taop-hugo`) to be sure.
- Plain `hugo` on the host also works if installed (`hugo server`).

A clean build currently produces **8 category pages + 23 lessons** with exit 0.

---

## 3. Repo map (what was added)

```
YESQL.md                          strategy + taxonomy v2 + launch plan
YESQL-HANDOFF.md                  this file
Dockerfile, .dockerignore, Makefile   Dockerized Hugo dev server

layouts/yesql/
  hub.html                        Tier 1 — the /yesql/ landing hub (category grid)
  list.html                       Tier 2 — a category/concept page (lesson grid)
  single.html                     Tier 3 — a lesson page (article + sidebar + offer)
layouts/partials/yesql/
  head.html                       page-aware <head> on the modern shell
  offer.html                      reusable contextual CTA card (dict-driven)

static/css/yesql.css              all YeSQL styling (layered over style.css)
static/img/yesql/                 figures ported from the lab starter-kit

content/yesql/
  _index.md                       hub (layout = "hub")
  <category>/_index.md            8 category pages (title/weight/icon/summary)
  <category>/<slug>.md            lessons

themes/taop/layouts/partials/header.html   MODIFIED: nav BLOG → YESQL (/yesql/)
```

How Hugo wires it: content section `yesql` → `layouts/yesql/`. The hub `_index.md`
sets `layout = "hub"`. Nested category `_index.md` files use `list.html`. Regular
lesson `.md` files use `single.html`. URLs are dateless (`/yesql/<cat>/<slug>/`)
from the default section permalink — no `config.toml` change needed.

---

## 4. Authoring a lesson (conventions — follow exactly)

Front matter is TOML between `+++`:

```
+++
title = "What is an SQL Aggregate?"
weight = 20                      # ordering within the category
summary = "One sentence; shown on the category card and meta description."
tags = ["SQL", "Aggregate", "GROUP BY"]
book_chapter = "Chapter 15, Group By, Having, With, Union All"
# optional CTA overrides (default offer = the book):
# cta_eyebrow / cta_title / cta_body / cta_url / cta_label
+++
```

Rules:
- **Voice:** first-person, direct, opinionated, addresses "you" the app developer.
- **Length:** ~250–500 words. Free = "what it is, why it matters, ONE worked
  example." Do **not** reproduce whole book chapters — distill. Reuse at most one
  short example query verbatim; keep surrounding prose original.
- **No hard CTA in the body.** `single.html` auto-renders the book-attribution box
  (from `book_chapter`) and the offer card. End with a light forward-pointer or an
  internal cross-link instead.
- **Code fences:** ` ```sql ` for queries (syntax-highlighted). **Plain ` ``` `
  (no language)** for psql/terminal output, schema dumps, EXPLAIN plans, ASCII
  tables — these render as a dark terminal block, so box-drawing lines up.
- **Cross-links** are root-relative: `/yesql/<cat>/<slug>/`.

To add a new category: create `content/yesql/<slug>/_index.md` with
`title`, `weight`, `icon` (a Font Awesome class, e.g. `fa-solid fa-cube`), and
`summary`. It appears on the hub automatically.

---

## 5. Taxonomy v2 (8 categories)

Consolidated from the book's 52 chapters (chapter titles → lesson titles;
interviews and scaffolding chapters filtered out). Full mapping in
[`YESQL.md`](YESQL.md).

`sql-foundations` · `querying-data` · `writing-sql` · `indexing-performance` ·
`data-types` · `data-modeling` · `concurrency` · `extensions-spatial`

---

## 6. Current state — lessons per category

| Category | # | Lessons | Source |
|---|---|---|---|
| sql-foundations | 3 | how-to-learn-sql, what-is-a-relation, why-postgres | refreshed 2019 posts |
| querying-data | 6 | what-is-a-join, sql-aggregates, grouping-sets-and-filter, with-recursive, nested-lateral-joins, percentiles-in-one-query | posts + lab starter-kit |
| writing-sql | 3 | sql-is-code, business-logic-in-sql, the-psql-repl | book (distilled) |
| indexing-performance | 3 | indexing-strategy, postgresql-index-types, reading-explain | book (distilled) |
| data-types | **1** | serialization-and-deserialization | book (distilled) |
| data-modeling | 1 | the-r-in-orm | refreshed 2019 post |
| concurrency | 4 | insert-update-delete, isolation-and-locking, triggers, listen-notify | book (distilled) |
| extensions-spatial | 2 | knn-search, map-as-text | lab starter-kit |

**Total: 23 lessons.** Original 12-lesson launch set (6 refreshed evergreen posts +
6 lab starter-kit queries) is complete; the four previously-empty categories were
then filled from book content via parallel drafting agents.

---

## 7. TODO / open items (next session)

1. **Finish `data-types`** — 2 lessons were planned but not written (the drafting
   run was interrupted). Missing:
   - `a-tour-of-postgresql-data-types.md` — title "A Tour of PostgreSQL Data Types",
     weight 20, `book_chapter = "Chapter 23, PostgreSQL Data Types"`,
     source `taop-vol-1/en/04-data-types/02-pg-data-types-101.md`.
   - `json-and-denormalized-types.md` — title "JSON and Other Denormalized Types",
     weight 30, `book_chapter = "Chapter 24, Denormalized Data Types"`,
     source `taop-vol-1/en/04-data-types/04-non-relational-types.md`.
   (Note: `serialization-and-deserialization.md` already forward-links to the
   first of these — the link 404s until it's written.)
2. **Review the book-distilled lessons for voice/accuracy** — `writing-sql`,
   `indexing-performance`, `concurrency`, and `data-types` were drafted by agents
   from the book. `indexing-performance/reading-explain.md` in particular drew on
   general PostgreSQL knowledge where the source chapter was thin — verify it.
3. **301-redirect the 11 old `/blog/...` URLs** to their YeSQL homes (or to
   `/yesql/`) before retiring the blog, to preserve SEO equity.
4. **Retire / repurpose `content/blog/`** — decide between deleting, redirecting,
   or demoting the PostgresOpen/PgDay posts into a small dated "What's New"
   sub-feed (see YESQL.md).
5. **Mobile header clearance** — `body.yesql { padding-top: 96px }` clears the
   fixed desktop header; on narrow viewports the nav wraps taller and may need a
   media-query bump.
6. **Clarify "main hero of the main page"** — interpreted as the YeSQL hub hero
   (fixed via header clearance). Confirm the requester didn't mean the site
   homepage `/`.

---

## 8. Content source repos (for reuse)

Siblings of this repo under `/Users/dim/dev/TAOP/`:
- `taop-vol-1/` — **book source** (`en/<part>/<section>.md`, 52 chapters). Distill,
  don't copy.
- `TheArtOfPostgreSQL/` — **public lab / starter-kit** (`starter-kit/*.md`,
  `datasets.md`, `toc.txt`). Already public — safe to reuse freely.

---

## 9. Continuing the Claude Code session on another machine

The **work** travels via git (this branch). The **conversation/session** does not
sync automatically — Claude Code stores transcripts locally per project path.

- Project context that *does* travel with the repo: this file, `YESQL.md`, and git
  history. Starting fresh on the other machine with these is usually enough.
- Project **memory** (`~/.claude/projects/-Users-dim-dev-TAOP-taop-xyz/memory/`)
  is machine-local and is **not** in git — copy that folder over if you want the
  saved `taop-repo-layout` / `yesql-hub-plan` memories there too.
- To literally resume *this chat*, copy the session transcript
  `~/.claude/projects/-Users-dim-dev-TAOP-taop-xyz/d6626391-…jsonl` into the
  matching project folder on the other machine (the folder name is derived from
  the repo's absolute path, so it differs if the checkout path differs), then
  `claude --resume` from the repo.
