# pglite-datasets

Builds the `.sql.gz` files under `../static/data/pglite/` that
[`layouts/partials/yesql/pglite.html`](../layouts/partials/yesql/pglite.html)
fetches and loads into [PGlite](https://pglite.dev) (Postgres compiled to
WebAssembly) client-side, powering the "Run it yourself" widget embedded in
each SQL code block on PGlite-enabled YeSQL lessons.

**The output is committed, not generated at build time.** `hugo`/`hugo
--minify` just copies whatever's already under `static/data/pglite/` as-is —
Hugo's build has no Docker step and can't run anything in this directory.
This tooling is a dev-time helper for producing and refreshing those
committed files, run manually and checked in like any other static asset,
not part of the site's actual build or deploy pipeline.

## How it works

This directory is a self-contained Docker build, not a script you run
against some database you already have open. The
[`Dockerfile`](Dockerfile) is built `FROM
ghcr.io/dimitri/theartofpostgresql/postgres-seeded:16` — **the exact
pre-seeded PostgreSQL image the Docker starter kit
([`dimitri/TheArtOfPostgreSQL`](https://github.com/dimitri/TheArtOfPostgreSQL))
and app.taop.xyz's own `lab` docker-compose service both run** — with one
script ([`dump-datasets.sh`](dump-datasets.sh)) layered on top as its
entrypoint. Running the built image starts that same seeded Postgres in the
background, waits for it, runs `pg_dump` against it for each dataset, and
writes the gzipped result to a bind-mounted `/output` directory. Nothing
outside the container needs to be running first — no docker-compose project
to have checked out, no port to free up, no container name to guess. Build
once, run any time, always from the same known-good seed data.

```console
make            # build every dataset: f1db.sql.gz, chinook.sql.gz, magic.sql.gz
make f1db       # just one
make chinook
make magic
make clean      # remove the built image (does not touch the vendored .sql.gz files)
```

Requires only Docker — no local `pg_dump`/`psql`, no running Postgres, no
network access beyond pulling the base image once.

## Why INSERT, not COPY

`pg_dump`'s default format loads data via `COPY ... FROM stdin;`, which
needs an interactive client streaming rows after the command — PGlite's
`.exec(sql)` just runs a plain SQL string, with no stdin for a COPY block to
read from. (PGlite does support `COPY`, but only through a separate
`/dev/blob` virtual-device mechanism, not by running a plain SQL script — see
[PGlite's docs](https://pglite.dev/docs/api)). So every dump here uses
`pg_dump --inserts --rows-per-insert=1000`: multi-row `INSERT` statements
`.exec()` can run directly. `--rows-per-insert=1000` (batching 1000 rows per
statement instead of pg_dump's default one-row-per-INSERT) roughly halves
load time for the larger tables — f1db's 417k-row `laptimes` table alone
brought f1db's seed time from ~7.5s down to ~4s in testing.

Two more things get stripped/handled that a plain `pg_dump` wouldn't give
you for free:

- **`\restrict`/`\unrestrict`** — psql-only meta-commands newer `pg_dump`
  versions wrap output in. Not valid SQL; PGlite's `exec()` has no psql
  client to interpret them, so they'd break loading on the very first line.
  Stripped unconditionally.
- **`magic` needs two separate `pg_dump` calls.** `json-and-denormalized-types.md`
  needs both the `magic` schema (`cards`/`sets`/`allsets`) *and*
  `public.hashtag`, which lives outside that schema. The obvious single
  command — `pg_dump --schema=magic --table=public.hashtag` — silently
  drops the `--schema` selector when `--table` is also given, producing a
  dump with zero `magic.*` tables in it (confirmed by inspecting the
  generated SQL, not assumed). `dump-datasets.sh` runs two separate
  `pg_dump` invocations and concatenates them instead.

## Runtime search_path, not baked into the dump

Every dump here creates its tables under a schema named after the dataset
(`f1db`, `chinook`, `magic`) so more than one dataset's persisted PGlite
store can coexist without name collisions — but every lesson's queries are
written unqualified (`from results`, not `from f1db.results`), matching how
they read in the book. That means `search_path` has to be set correctly on
the PGlite side, not here. `ALTER DATABASE ... SET search_path` would only
need doing once, at seed time, but PGlite doesn't honor
`pg_db_role_setting` on reconnect (verified: the `ALTER` succeeds and writes
the catalog row, but a fresh connection to the same persisted store still
boots with `search_path=public` regardless) — so
`layouts/partials/yesql/pglite.html`'s loader issues a plain `SET
search_path TO <dataset>, public;` itself, on every connection.

## Datasets

| File | Schema(s) | Used by |
|---|---|---|
| `f1db.sql.gz` | `f1db` | Every lesson with `lab_datasets = "f1db"` |
| `chinook.sql.gz` | `chinook` | Every lesson with `lab_datasets = "chinook"` |
| `magic.sql.gz` | `magic` (cards/sets/allsets) + `public.hashtag` | `json-and-denormalized-types.md`, `why-postgres.md` |

Not every PGlite-eligible-looking lesson gets a dataset here — see
`sql-and-ai-schema.md`, which was deliberately switched back to the
Docker-only "Open the Lab" banner (`pglite = true` removed) instead: its
example needs `EXCLUDE USING GIST (... WITH =, ...)`, which needs the
`btree_gist` extension. That extension is installed on the live lab image
this Dockerfile is built from, but PGlite's own bundled Postgres build
rejects it outright (`extension "btree_gist" is not available`) — a hard
incompatibility no amount of dataset-prep can work around.
