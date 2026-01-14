#!/usr/bin/env bash
set -e -o pipefail

# Development session initialization.
# Used by: npm run dev

echo "Initializing dev session: $A2A_SESSION_ID"

# Add MCP servers (project scope).
# These may fail locally if already installed at user scope - that's ok.
claude mcp add --scope project shellwright -- npx -y @dwmkerr/shellwright || true
claude mcp add --scope project playwright -- npx @playwright/mcp@latest --browser chromium --headless || true

# Add marketplace plugins (project scope).
# These may fail locally if already installed at user scope - that's ok.
claude plugin marketplace add dwmkerr/claude-toolkit || true
claude plugin install --scope project toolkit@claude-toolkit || true

# Set up CLAUDE.md for development.
# mkdir -p .claude
# cat > .claude/CLAUDE.md << 'EOF'
# # Development Agent
# Your custom instructions here.
# EOF

echo "Dev session initialization complete"
