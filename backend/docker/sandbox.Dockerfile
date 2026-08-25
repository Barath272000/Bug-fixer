FROM node:22-bookworm-slim
RUN useradd --create-home --uid 10001 sandbox
WORKDIR /workspace
USER sandbox
ENTRYPOINT ["/bin/sh","-lc"]
