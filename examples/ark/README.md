# Ark Testing Example

Use the Claude Code Agent for testing [Ark](https://github.com/mckinsey/agents-at-scale-ark) pull requests. The agent creates isolated Kind clusters, deploys Ark, runs tests, and captures screenshots.

## Setup

The agent needs Docker access to create Kind clusters.

```bash
# Run local with live-reload. Unsafe.
npm run dev:ark

# Run in a container, mount skills, expose 2222.
make docker-run-ark

# Live reload in a k8s cluster with DinD for Kind.
devspace dev -p ark

# Install with helm.
helm install claude-code-agent ./chart \
  -f examples/ark/values-dind.yaml \
  --set apiKey=$ANTHROPIC_API_KEY
```

## Skills

This example includes skills in `examples/ark/skills/`:

- **ark-setup** - Set up Ark from source with Kind
- **ark-testing** - Test dashboard UI with Playwright
- **ark-analysis** - Analyze Ark codebase and issues
