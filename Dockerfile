ARG BASE_VERSION="0.1.2" # x-release-please-version

FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY src/ ./src/
RUN npm ci

FROM ghcr.io/dwmkerr/claude-code-agent-base:${BASE_VERSION}

WORKDIR /app

COPY --chown=claude-code-agent:nogroup package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --chown=claude-code-agent:nogroup --from=builder /app/dist ./dist/

RUN mkdir -p /workspace && chown claude-code-agent:nogroup /workspace

USER claude-code-agent
ENV HOME=/home/claude-code-agent

EXPOSE 2222

ENTRYPOINT ["node", "dist/main.js"]
CMD []
