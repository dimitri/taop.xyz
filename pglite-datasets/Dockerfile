# Builds the SQL seed files the YeSQL lessons' in-browser "Run it
# yourself" widget loads into PGlite client-side
# (../layouts/partials/yesql/pglite.html). Layered directly on the
# pre-seeded lab image itself — the same one the Docker starter kit and
# app.taop.xyz's own "lab" service both run — rather than dumping
# against some separately-started instance of it, so this reproduces
# deterministically from just this directory: no docker-compose project
# to have checked out and running first, no port to free up, no
# container name to guess. See README.md for what this does and why.
FROM ghcr.io/dimitri/theartofpostgresql/postgres-seeded:16

COPY dump-datasets.sh /usr/local/bin/dump-datasets.sh
RUN chmod +x /usr/local/bin/dump-datasets.sh

ENTRYPOINT ["/usr/local/bin/dump-datasets.sh"]
