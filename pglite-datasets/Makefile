# Builds static/data/pglite/{f1db,chinook,magic}.sql.gz — the datasets
# PGlite loads client-side for the YeSQL lessons' "Run it yourself"
# widget (../layouts/partials/yesql/pglite.html). See README.md.
#
#   make            - build every dataset
#   make f1db       - build just f1db.sql.gz
#   make chinook    - build just chinook.sql.gz
#   make magic      - build just magic.sql.gz
#   make clean      - remove the built Docker image

IMAGE := taop-pglite-datasets
OUT   := $(abspath ../static/data/pglite)
# Only ever used inside this throwaway, --rm'd container's own ephemeral
# data directory (no volume, gone the moment the run finishes) — not a
# credential for anything real.
RUN   := docker run --rm -e POSTGRES_DB=taop -e POSTGRES_USER=taop -e POSTGRES_PASSWORD=taop -v $(OUT):/output $(IMAGE)

.PHONY: all f1db chinook magic build clean

all: build
	$(RUN) all

f1db: build
	$(RUN) f1db

chinook: build
	$(RUN) chinook

magic: build
	$(RUN) magic

build:
	docker build -t $(IMAGE) .

clean:
	-docker rmi $(IMAGE) >/dev/null 2>&1
