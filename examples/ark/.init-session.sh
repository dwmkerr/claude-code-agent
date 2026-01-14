#!/usr/bin/env bash
set -e -o pipefail

# Session initialization for Ark example.
# Runs once when a new A2A session starts.

echo "Initializing session: $A2A_SESSION_ID"

# Sanity checks for required tools / config.
[ -n "$DOCKER_HOST" ] && ! docker info > /dev/null 2>&1 && echo "error: DinD not ready on $DOCKER_HOST" || true
! kubectl cluster-info > /dev/null 2>&1 && echo "error: kubectl has no cluster access" || true

# Configure MCP servers.
claude mcp add playwright -- npx @playwright/mcp@latest --browser chromium --headless

# Install Ark skills and agents from marketplace.
claude plugin marketplace add mckinsey/agents-at-scale-ark
claude plugin install ark@agents-at-scale-ark

# Set up CLAUDE.md with Ark-specific instructions.
mkdir -p .claude
cat > .claude/CLAUDE.md << 'EOF'
# Ark Testing Agent

You are running inside a Docker container. When working with Kind clusters, you MUST follow these rules:

## CRITICAL: Kind Kubeconfig

**ALWAYS use `--internal` flag when exporting kubeconfig:**

```bash
kind export kubeconfig --name <cluster-name> --internal
```

Without `--internal`, kubectl will fail with "connection refused" because:
- Kind sets the API server to 127.0.0.1 by default
- This container cannot reach 127.0.0.1 on the Kind container
- The `--internal` flag uses Docker DNS names instead

## Kind Cluster Creation

When creating Kind clusters:

```bash
kind create cluster --name ark-cluster
kind export kubeconfig --name ark-cluster --internal
kubectl cluster-info  # Verify connection works
```

## Building ark-cli

Always build ark-cli from source in `tools/ark-cli`:

```bash
cd <repo>/tools/ark-cli
npm install
npm run build
node dist/index.js install --yes --wait-for-ready 5m
```

DO NOT use `npm install -g @agents-at-scale/ark` - always build from source.
EOF

echo "Session initialization complete"
