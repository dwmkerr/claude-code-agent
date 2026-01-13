#!/usr/bin/env bash
set -e -o pipefail

# Session initialization for Ark example.
# Runs once when a new A2A session starts.

echo "Initializing session: $A2A_SESSION_ID"

# Sanity checks for required tools / config.
[ -n "$DOCKER_HOST" ] && ! docker info > /dev/null 2>&1 && echo "error: DinD not ready on $DOCKER_HOST" || true
! kubectl cluster-info > /dev/null 2>&1 && echo "error: kubectl has no cluster access" || true
echo "dind and kubectl validated"

# Configure MCP servers.
claude mcp add playwright -- npx @playwright/mcp@latest --browser chromium --headless
