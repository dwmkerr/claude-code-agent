#!/usr/bin/env bash
set -e -o pipefail

# Development session initialization.
# Used by: npm run dev

echo "Initializing dev session: $A2A_SESSION_ID"

# Add MCP servers for development.
claude mcp add shellwright -- npx -y @dwmkerr/shellwright || true
claude mcp add playwright -- npx @playwright/mcp@latest --browser chromium --headless || true

# Add marketplace plugins (can include skills, agents, commands, etc).
# Use || true for marketplace add - "already installed" is not an error.
claude plugin marketplace add dwmkerr/claude-toolkit || true
claude plugin install toolkit@claude-toolkit || true

# Set up CLAUDE.md for development.
# mkdir -p .claude
# cat > .claude/CLAUDE.md << 'EOF'
# # Development Agent
# Your custom instructions here.
# EOF

echo "Dev session initialization complete"
