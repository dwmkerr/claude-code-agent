<p align="center">
  <h1 align="center"><code>claude-code-agent</code></h1>
  <p align="center">Run Claude Code as a containerized A2A agent</p>
  <p align="center">
    <a href="#quickstart">Quickstart</a> |
    <a href="#deploy">Deploy</a> |
    <a href="#configuration">Configuration</a> |
    <a href="#skills">Skills</a>
  </p>
  <p align="center">
    <a href="https://github.com/dwmkerr/claude-code-agent/actions/workflows/cicd.yaml"><img src="https://github.com/dwmkerr/claude-code-agent/actions/workflows/cicd.yaml/badge.svg" alt="cicd"></a>
    <a href="https://www.npmjs.com/package/@dwmkerr/claude-code-agent"><img src="https://img.shields.io/npm/v/%40dwmkerr/claude-code-agent" alt="npm"></a>
    <a href="https://codecov.io/gh/dwmkerr/claude-code-agent"><img src="https://codecov.io/gh/dwmkerr/claude-code-agent/graph/badge.svg" alt="codecov"></a>
  </p>
</p>

<p align="center">
  <img src="./docs/images/terminal-screenshot.png" width="600" alt="Claude Code Agent terminal output">
</p>

## Quickstart

```bash
export ANTHROPIC_API_KEY="sk-***"
npm install && npm run dev
# Server: http://localhost:2222
```

Test with curl:

```bash
curl -N -X POST http://localhost:2222/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"message/stream","params":{"message":{"messageId":"1","contextId":"ctx-1","role":"user","parts":[{"kind":"text","text":"Hello"}]}},"id":1}'
```

## Deploy

**Docker**

```bash
docker run -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY -p 2222:2222 ghcr.io/dwmkerr/claude-code-agent
```

**Helm**

```bash
helm repo add dwmkerr https://dwmkerr.github.io/claude-code-agent
helm install claude-code-agent dwmkerr/claude-code-agent --set apiKey=$ANTHROPIC_API_KEY
```

**DevSpace**

```bash
devspace dev
```

**A2A Inspector**

```bash
git clone https://github.com/google/A2A.git
cd A2A && ./scripts/run.sh
# Connect to http://localhost:2222
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | API key (required) | - |
| `CLAUDE_ALLOWED_TOOLS` | Allowed tools | `Bash,Read,Edit,Write,Grep,Glob` |
| `CLAUDE_PERMISSION_MODE` | Permission mode | `acceptEdits` |
| `CLAUDE_TIMEOUT_SECONDS` | Execution timeout | `300` |
| `FORCE_COLOR` | Enable colors in logs | `0` |

## Skills

Custom Claude Code skills in `skills/`. Loaded automatically.

## API

Implements [A2A protocol](https://github.com/google/A2A):

- `GET /.well-known/agent-card.json` - Agent metadata
- `POST /` - JSON-RPC messages
- `GET /health` - Health check

## Development

```bash
npm install
npm run dev      # Development with hot-reload
npm test         # Run tests
npm run build    # Build for production
```

## Todo / Improvements

**Sessions**

- [ ] properly track session id
- [ ] run one process/pwd per session for slightly better isolation - clear docs that separate containers per session is safer
