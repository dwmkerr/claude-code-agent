# Installation

## Docker

```bash
docker run -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY -p 2222:2222 \
  ghcr.io/dwmkerr/claude-code-agent
```

## DevSpace (Kubernetes with Live-Reload)

```bash
devspace dev
devspace dev -p ark  # Ark example with DinD for Kind clusters
```

## Helm (Kubernetes)

```bash
helm install claude-code-agent oci://ghcr.io/dwmkerr/charts/claude-code-agent \
  --set apiKey=$ANTHROPIC_API_KEY
```

### Testing with Minikube

```bash
docker build -t claude-code-agent:local .
minikube image load claude-code-agent:local
helm install claude-code-agent ./chart \
  --set image.repository=claude-code-agent \
  --set image.tag=local \
  --set image.pullPolicy=Never \
  --set apiKey=$ANTHROPIC_API_KEY
```

## Ark

```bash
# Install ark.
npm install -g @agents-at-scale/ark
ark install

# Either install the agent...
helm install claude-code-agent oci://ghcr.io/dwmkerr/charts/claude-code-agent --set apiKey=$ANTHROPIC_API_KEY
# ...or run in the cluster with live-reload
devspace dev

# Check the status of the a2a server and claude code agent.
kubectl get a2aserver
kubectl get agent

# Run the ark dashboard and chat, send a single message, or run the interactive
# chat in the terminal.
ark dashboard
ark query agent/claude-code 'hi'
```
