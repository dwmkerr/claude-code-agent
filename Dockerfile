FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY src/ ./src/
RUN npm ci

FROM dwmkerr/claude-code-agent-base:0.1.1-rc6

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist/

RUN mkdir -p /workspace && chown -R claude-code-agent:nogroup /app /workspace

USER claude-code-agent
ENV HOME=/home/claude-code-agent

EXPOSE 2222

ENTRYPOINT ["node", "dist/main.js"]
CMD []
