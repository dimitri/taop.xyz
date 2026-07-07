# Hugo dev server for The Art of PostgreSQL website.
# Pinned to the same version the site is built with (extended, 0.83.1).
FROM debian:bookworm-slim

ARG HUGO_VERSION=0.83.1

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates wget libstdc++6 \
 && wget -qO /tmp/hugo.tar.gz \
      "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz" \
 && tar -xzf /tmp/hugo.tar.gz -C /usr/local/bin hugo \
 && rm /tmp/hugo.tar.gz \
 && apt-get purge -y wget && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /src
EXPOSE 1313

# Live-reloading dev server. Browse at http://localhost:1313/yesql/
CMD ["hugo", "server", \
     "--bind", "0.0.0.0", "--port", "1313", \
     "--baseURL", "http://localhost:1313/", "--appendPort=false", \
     "--disableFastRender"]
