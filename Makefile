PORT  := 1313

.PHONY: help serve build diagrams pglite-datasets

help:
	@echo "make serve            - run the live Hugo server at http://localhost:$(PORT)/yesql/"
	@echo "make build            - render the static site into ./docs (production output)"
	@echo "make diagrams         - compile TikZ → SVG for all lesson diagrams"
	@echo "make pglite-datasets  - rebuild the PGlite datasets the YeSQL lessons load client-side"
	@echo "make serve PORT=1314  - use a different port"

serve:
	hugo server --port $(PORT) --bind 0.0.0.0

build:
	hugo --minify

diagrams:
	$(MAKE) -C diagrams all

pglite-datasets:
	$(MAKE) -C pglite-datasets all
