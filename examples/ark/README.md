# Ark Testing Example

Use the Claude Code Agent for testing [Ark](https://github.com/mckinsey/agents-at-scale-ark) pull requests:

- Creates Kubernetes clusters and can install/setup Ark
- Able to analyse the codebase in detail using specialised skills
- Uses MCP servers (Playwright) to test the dashboard UI and take screenshots

## Setup

### Docker (local development)

```bash
# Run in a container with skills, MCP config, expose 2222.
make docker-run
```

### Kubernetes (Helm)

```bash
# Deploy to Kubernetes (creates ConfigMaps from local files)
export ANTHROPIC_API_KEY="sk-..."
make helm-install

# Remove deployment
make helm-uninstall
```

### DevSpace (live reload in cluster)

```bash
cd examples/ark
devspace dev
```

## Claude Configuration

This example includes Claude config:

```
mcp-config.json    # MCP servers config (passed via --mcp-config)
claude/
  CLAUDE.md        # System prompt with critical instructions
  skills/          # Skills for Ark workflows:
    ark-setup/     # Set up Ark from source with Kind
    ark-testing/   # Test dashboard UI with Playwright
    ark-analysis/  # Analyze Ark codebase and issues
values.yaml        # Helm values (references ConfigMaps created from above)
```

- **Docker**: Files mounted directly into container
- **Helm**: `make helm-install` creates ConfigMaps from files, `values.yaml` references them

## Examples

### Setup an entire Ark Cluster running a Pull Request

Use the `Ark Setup` skill to create a Kubernetes Cluster, install Ark from a pull request branch, validate that all services are running correctly.

Running the Query:

```bash
ark query agent/ark-claude-code-agent "Check out https://github.com/mckinsey/agents-at-scale-ark/pull/531 and use the ark-setup skill to install ark and give me the output of 'ark status'"
```


<details>
<summary>bash</summary>

```bash
query="Check out https://github.com/mckinsey/agents-at-scale-ark/pull/531 and use the ark-setup skill to install ark and give me the output of 'ark status'"

curl -N -X POST http://localhost:2222/ \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "jsonrpc": "2.0",
  "method": "message/stream",
  "params": {
    "message": {
      "messageId": "1",
      "contextId": "ctx-1",
      "role": "user",
      "parts": [{
        "kind": "text",
        "text": "${query}"
      }]
    }
  },
  "id": 1
}
EOF
```

</details>

Snapshot of Claude Code:

![Process Screenshot](./docs/ark-setup-claude-screenshot.png)

Final Result:

```
## Ark Status Summary

  **Cluster Access:**
  - ✓ Connected to: kind-ark-cluster (172.18.0.2)

  **Ark Services:**
  - ✓ ark-tenant: healthy (v0.1.46, deployed)
  - ✓ ark-api: healthy (v0.1.46, 1/1 replicas ready)
  - ✓ ark-dashboard: healthy (v0.1.46, 1/1 replicas ready)
  - ○ ark-mcp: not ready (0/1 replicas ready)
  - ○ ark-cluster-memory: not ready (0/1 replicas ready)

  **Ark Status:**
  - ✓ ark-controller: ready (v0.1.46, 1/1 replicas ready)
  - ✓ Version: up to date (0.1.46)

  Duration: 508s (~8.5 min), Cost: $0.38
```


For analysis, this snippet.

```bash
query="Check out https://github.com/mckinsey/agents-at-scale-ark/pull/531 and use the ark-analysis skill to build a suggested implementation plan"

curl -N -X POST http://localhost:2222/ \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "jsonrpc": "2.0",
  "method": "message/stream",
  "params": {
    "message": {
      "messageId": "1",
      "contextId": "ctx-1",
      "role": "user",
      "parts": [{
        "kind": "text",
        "text": "${query}"
      }]
    }
  },
  "id": 1
}
EOF
```


Or with Ark Query resource:

```bash
# Check agents exist.
kubectl get a2aserver
kubectl get agents

kubectl apply -f - <<EOF
apiVersion: ark.mckinsey.com/v1alpha1
kind: Query
metadata:
  name: test-query
spec:
  targets:
    - kind: Agent
      name: claude-code-agent
  input:
    - role: user
      content: "${query}"
EOF

# Watch query status
kubectl get query test-query -w
```

## Debugging

```bash
# View chunk logs from make docker-run-ark (if CLAUDE_LOG_PATH was set)
# Log is JSONL format (one JSON object per line)
docker exec $(docker ps --filter ancestor=claude-code-agent -q) cat /tmp/claude-code-agent-log.jsonl

# Show MCP config file.
docker exec $(docker ps --filter ancestor=claude-code-agent -q) cat /config/mcp-config.json
```
