IMAGE := taop-hugo
NAME  := taop-hugo
PORT  := 1313

.PHONY: help image serve build stop clean

help:
	@echo "make serve   - build the image (if needed) and run the live Hugo server"
	@echo "               then browse http://localhost:$(PORT)/yesql/"
	@echo "make image   - (re)build the Docker image for Hugo"
	@echo "make build   - render the static site into ./docs (production output)"
	@echo "make stop    - stop the running dev server container"
	@echo "make clean   - stop the container and remove the image"

image:
	docker build -t $(IMAGE) .

# Live-reloading dev server. The repo is bind-mounted at /src; edits on the host
# are picked up automatically. Ctrl-C to stop.
serve: image
	docker run --rm -it --name $(NAME) \
		-p $(PORT):1313 \
		-v "$(CURDIR)":/src \
		$(IMAGE)

# One-off production build into ./docs (the configured publishDir).
build: image
	docker run --rm -v "$(CURDIR)":/src $(IMAGE) hugo --minify

stop:
	-docker stop $(NAME)

clean: stop
	-docker rmi $(IMAGE)
