# Ark Testing Example

Claude Code Agent for testing [Ark](https://github.com/mckinsey/agents-at-scale-ark) pull requests - creates K8s clusters, installs Ark, and takes screenshots of UI changes.

![Screenshot of Claude Code Agent for Ark](./docs/devspace-screenshot.png)

## Quickstart

```bash
cd examples/ark
devspace dev
```

## What It Does

1. Checks out a PR branch
2. Creates a Kind cluster
3. Installs Ark from source
4. Runs Playwright to screenshot dashboard changes

## Examples

Quickly check on skills and agents:

```bash
ark query agent/ark-claude-code-agent "Tell me what skills and agents you have"
```

Setup Ark from a PR and show status:

```bash
ark query agent/ark-claude-code-agent "Please checkout https://github.com/mckinsey/agents-at-scale-ark/pull/631 check this PR out use the ark setup skill to setup up ark and the ark dashboard testing skill to open the ark dashboard and take screenshots of the changed content and add them to the PR with review comments use the github attach images skill to attach these images to a comment."
```

Screenshot dashboard changes before/after a PR:

```bash
ark query agent/ark-claude-code-agent \
  'Checkout https://github.com/mckinsey/agents-at-scale-ark/pull/544, use ark-setup skill to install, then ark-dashboard-testing skill to screenshot changes'
```

## Configuration

```
mcp-config.json     # MCP servers (Playwright)
claude/
  CLAUDE.md         # System prompt
  skills/           # ark-setup, ark-dashboard-testing, ark-analysis
```
