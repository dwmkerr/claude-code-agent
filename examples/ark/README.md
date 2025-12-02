# Ark Testing Example

Use the Claude Code Agent for testing [Ark](https://github.com/mckinsey/agents-at-scale-ark) pull requests. The agent creates isolated Kind clusters, deploys Ark, runs tests, and captures screenshots.

## Setup

The agent needs Docker access to create Kind clusters.

```bash
# Run in a container, mount skills, expose 2222.
make docker-run-ark

# Live reload in a k8s cluster with DinD for Kind.
devspace dev -p ark

# Install with helm.
helm install claude-code-agent ./chart \
  -f examples/ark/values-dind.yaml \
  --set apiKey=$ANTHROPIC_API_KEY
```

## Claude Configuration

This example includes Claude config in `examples/ark/claude/`:

- **CLAUDE.md** - System prompt with critical instructions (e.g., Kind `--internal` flag)
- **skills/** - Skills for Ark workflows:
  - **ark-setup** - Set up Ark from source with Kind
  - **ark-testing** - Test dashboard UI with Playwright
  - **ark-analysis** - Analyze Ark codebase and issues

The claude folder is copied to `~/.claude/` on startup.

## Testing

Run the following command to issue the query:

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
