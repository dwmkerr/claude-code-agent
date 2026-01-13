#!/bin/bash
# Session initialization for Ark example
# Runs once when a new A2A session starts

echo "Initializing Ark session: $A2A_SESSION_ID"

# Add MCP servers dynamically (no config file needed)
echo "Adding Playwright MCP server..."
claude mcp add playwright -- npx @playwright/mcp@latest --browser chromium --headless

# Check DinD connectivity if DOCKER_HOST is set
if [ -n "$DOCKER_HOST" ]; then
  echo "Checking DinD connectivity ($DOCKER_HOST)..."
  if docker info > /dev/null 2>&1; then
    echo "  DinD: ready"
  else
    echo "  DinD: not ready (Kind clusters will fail)"
  fi
fi

# Check kubectl access
echo "Checking kubectl access..."
if kubectl cluster-info > /dev/null 2>&1; then
  echo "  kubectl: connected"
else
  echo "  kubectl: no cluster access"
fi

echo "Session initialization complete"
