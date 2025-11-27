FROM node:20-slim

RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install -g @anthropic-ai/claude-code

RUN adduser --system --uid 1001 --home /home/ark ark && \
    mkdir -p /home/ark && \
    chown -R ark:nogroup /home/ark

COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src/ ./src/
COPY skills/ /home/ark/.claude/skills/

RUN npm run build

RUN chown -R ark:nogroup /app /home/ark/.claude

USER ark
ENV HOME=/home/ark

EXPOSE 2528

CMD ["node", "dist/main.js"]
