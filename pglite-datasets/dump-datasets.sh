#!/usr/bin/env bash
# Runs inside a container built from this directory's Dockerfile (base:
# ghcr.io/dimitri/theartofpostgresql/postgres-seeded:16). Starts the
# base image's own postgres in the background — the same way its normal
# entrypoint would — waits for it, dumps each PGlite dataset to
# /output/<name>.sql.gz, then exits. /output is meant to be bind-mounted
# to ../static/data/pglite (see the Makefile).
#
# Usage (inside the container): dump-datasets.sh [f1db|chinook|magic|all]
# Defaults to "all".
set -Eeuo pipefail

WHAT="${1:-all}"
OUT="/output"

docker-entrypoint.sh postgres &

# -h 127.0.0.1 forces TCP: the seeded image's first-start runs its own
# bundled restore over a temporary unix-socket-only postgres before the
# real, network-reachable one comes up — same reasoning as
# app.taop.xyz's docker-compose.yml healthcheck for this exact image.
until pg_isready -h 127.0.0.1 -U taop -d taop >/dev/null 2>&1; do sleep 1; done

DUMP_FLAGS=(--inserts --rows-per-insert=1000 --no-owner --no-privileges --no-comments --no-tablespaces)

# Newer pg_dump wraps its output in \restrict/\unrestrict — psql-only
# meta-commands, not valid SQL, that break PGlite's exec() immediately
# since it has no psql client parsing them out. Strip both, always.
strip_psql_meta() { sed '/^\\restrict /d; /^\\unrestrict /d'; }

dump_schema() {
  local schema="$1" name="$2"
  pg_dump -h 127.0.0.1 -U taop -d taop --schema="$schema" "${DUMP_FLAGS[@]}" \
    | strip_psql_meta | gzip -9 > "$OUT/$name.sql.gz"
  echo "wrote $OUT/$name.sql.gz"
}

dump_f1db()    { dump_schema f1db f1db; }
dump_chinook() { dump_schema chinook chinook; }

# magic.{cards,sets,allsets} + public.hashtag (both needed by
# json-and-denormalized-types.md) — TWO separate pg_dump calls
# concatenated, not one `--schema=magic --table=public.hashtag` call:
# pg_dump silently drops the --schema selector when --table is also
# given, so a combined call produces a dump with zero magic.* tables in
# it (verified — not a flag-order or syntax mistake).
dump_magic() {
  local tmp; tmp="$(mktemp -d)"
  pg_dump -h 127.0.0.1 -U taop -d taop --schema=magic "${DUMP_FLAGS[@]}" \
    | strip_psql_meta > "$tmp/schema.sql"
  pg_dump -h 127.0.0.1 -U taop -d taop --table=public.hashtag "${DUMP_FLAGS[@]}" \
    | strip_psql_meta > "$tmp/hashtag.sql"
  cat "$tmp/schema.sql" "$tmp/hashtag.sql" | gzip -9 > "$OUT/magic.sql.gz"
  rm -rf "$tmp"
  echo "wrote $OUT/magic.sql.gz"
}

case "$WHAT" in
  f1db)    dump_f1db ;;
  chinook) dump_chinook ;;
  magic)   dump_magic ;;
  all)     dump_f1db; dump_chinook; dump_magic ;;
  *) echo "usage: dump-datasets.sh [f1db|chinook|magic|all]" >&2; exit 1 ;;
esac
