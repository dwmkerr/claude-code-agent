FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY src/ ./src/
RUN npm ci

FROM node:20-slim

# Claude Code uses Bash to run commands like curl, git, gh, etc.
# docker.io provides CLI for Kind when Docker socket is mounted.
# net-tools provides netstat for debugging.
RUN apt-get update && apt-get install -y \
    git \
    curl \
    docker.io \
    net-tools \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI.
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install kubectl, helm, devspace, kind - for Ark development.
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/$(dpkg --print-architecture)/kubectl" \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl \
    && rm kubectl
RUN ARCH=$(dpkg --print-architecture) && \
    curl -fsSL https://get.helm.sh/helm-v3.16.3-linux-${ARCH}.tar.gz | tar xz -C /tmp && \
    mv /tmp/linux-${ARCH}/helm /usr/local/bin/helm && \
    rm -rf /tmp/linux-${ARCH}
RUN curl -fsSL https://github.com/devspace-sh/devspace/releases/latest/download/devspace-linux-$(dpkg --print-architecture) -o /usr/local/bin/devspace \
    && chmod +x /usr/local/bin/devspace
RUN curl -Lo /usr/local/bin/kind https://kind.sigs.k8s.io/dl/v0.25.0/kind-linux-$(dpkg --print-architecture) \
    && chmod +x /usr/local/bin/kind

WORKDIR /app

RUN npm install -g @anthropic-ai/claude-code

# Create ark user with ~/.claude directory pre-created.
# Claude Code stores state in ~/.claude/ (todos, settings, etc).
# Pre-creating ensures ark owns it. Volume mounts overlay subdirectories:
#   ~/.claude/skills/ - read-only skills mount (:ro)
#   ~/.claude/todos/  - writable, created by Claude Code at runtime
#   ~/.claude/debug/  - writable, Claude Code writes debug logs here
RUN adduser --system --uid 1001 --home /home/ark ark && \
    mkdir -p /home/ark/.claude/debug && \
    chown -R ark:nogroup /home/ark

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist/

RUN mkdir -p /workspace && chown -R ark:nogroup /app /workspace

USER ark
ENV HOME=/home/ark

EXPOSE 2222

CMD ["node", "dist/main.js"]
