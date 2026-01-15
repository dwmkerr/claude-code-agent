#!/usr/bin/env bash
set -e -o pipefail

# Session initialization for Ark example.
# Runs once when a new A2A session starts.

echo "Initializing session: $A2A_SESSION_ID"

# Sanity checks - note any missing dependencies.
[ -n "$DOCKER_HOST" ] && ! docker info > /dev/null 2>&1 && echo "note: DinD not ready on $DOCKER_HOST" || true
! kubectl cluster-info > /dev/null 2>&1 && echo "note: kubectl has no cluster access (use kind-setup skill)" || true

# Add MCP servers (project scope).
# This may fail locally if already installed at user scope.
# Better would be to grep the error to see if it is 'already installed', warn
# in that case and then fail on any other error.
claude mcp add --scope project playwright -- npx @playwright/mcp@latest --browser chromium --headless || true

# Install the "ark-example" plugin from this repo's marketplace.
# Skills and agents are in ./examples/ark/plugin (see .claude-plugin/README.md).
claude plugin marketplace add dwmkerr/claude-code-agent || true
claude plugin install --scope project ark-example@claude-code-agent || true

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
