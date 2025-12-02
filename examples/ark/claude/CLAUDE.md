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
