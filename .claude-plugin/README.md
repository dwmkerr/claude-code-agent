# Claude Code Plugin Marketplace

This marketplace contains **example plugins** for demonstration purposes.
These are NOT part of the core claude-code-agent project.

## Plugins

| Plugin | Source | Description |
|--------|--------|-------------|
| `ark-example` | `./examples/ark/plugin` | Example Ark PR reviewer - demonstrates skills and agents |

## Installation

```bash
# Add this marketplace
claude plugin marketplace add dwmkerr/claude-code-agent

# Install the example plugin
claude plugin install ark-example@claude-code-agent
```

## Adding Core Project Plugins

If you want to add plugins that are part of the core project (not examples),
add them to the `plugins` array in `marketplace.json` with a clear name
that distinguishes them from examples.
