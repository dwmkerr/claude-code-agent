FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY src/ ./src/
RUN npm ci

FROM node:20-slim

# Claude Code uses Bash to run commands like curl, git, gh, etc.
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI (requires adding the repo first)
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install -g @anthropic-ai/claude-code

RUN adduser --system --uid 1001 --home /home/ark ark && \
    mkdir -p /home/ark && \
    chown -R ark:nogroup /home/ark

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist/
COPY skills/ /home/ark/.claude/skills/

RUN chown -R ark:nogroup /app /home/ark/.claude

USER ark
ENV HOME=/home/ark

EXPOSE 2222

CMD ["node", "dist/main.js"]
