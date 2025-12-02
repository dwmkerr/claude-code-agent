---
name: Ark Setup
description: Set up and install the Ark platform from source. Use this skill when the user wants to install, deploy, or configure Ark in their local Kubernetes cluster.
---

# Ark Setup

This skill helps you set up and install the Ark platform from source using the ark-cli.

## When to use this skill

Use this skill when:
- User wants to install or set up Ark
- User needs to deploy Ark to their local cluster
- User asks about getting Ark running
- User needs to troubleshoot Ark installation issues

## Prerequisites

Before installing Ark, ensure you have:

1. **Kubernetes cluster** - Kind, minikube, or similar
2. **kubectl** - Kubernetes CLI configured for your cluster
3. **Helm** - For installing Ark components
4. **Node.js** - For building the ark-cli tool

## Step 1: Clone the Ark repository

First, ensure you have cloned the Ark repository. If the user provided an org/repo, use that. Otherwise, use the default:

```bash
git clone https://github.com/mckinsey/agents-at-scale-ark.git
cd agents-at-scale-ark
```

If working on a pull request, checkout the PR branch:

```bash
git fetch origin pull/<PR_NUMBER>/head:pr-<PR_NUMBER>
git checkout pr-<PR_NUMBER>
```

## Step 2: Set up Kubernetes cluster

If you don't have a Kubernetes cluster running, create one with Kind.

**Important:** This agent runs in Docker, so always use `--internal` when exporting kubeconfig. This ensures kubectl/helm can reach the Kind cluster via Docker network addresses instead of localhost.

```bash
# Create Kind cluster
kind create cluster --name ark-cluster

# Export kubeconfig with internal addresses (required for Docker-in-Docker)
kind export kubeconfig --name ark-cluster --internal

# Verify connection
kubectl cluster-info
```

If `kubectl cluster-info` fails with connection refused, re-run the export with `--internal`.

## Step 3: Build the ark-cli from source

Build the CLI from the cloned repository. This ensures you use the version matching the code being tested:

```bash
cd agents-at-scale-ark
npm install
cd tools/ark-cli
npm install
npm run build
```

## Step 4: Install Ark using ark-cli

Use the built CLI to install Ark. Use direct node execution for reliability:

```bash
# From the tools/ark-cli directory
node dist/index.js install --yes --wait-for-ready 5m
```

Or if you're in the repo root:

```bash
node tools/ark-cli/dist/index.js install --yes --wait-for-ready 5m
```

The `--yes` flag auto-confirms prompts, and `--wait-for-ready` waits for services to be ready.

## Step 5: Verify installation

Check installation status:

```bash
node tools/ark-cli/dist/index.js status
```

Or use kubectl:

```bash
kubectl get pods -n ark
kubectl get pods -n ark-system
kubectl get services -n ark
```

Wait until all pods show as **Running** and services are ready.

## Troubleshooting

### Check pod status
```bash
kubectl get pods -A -o wide | grep -E '(ark|cert-manager)'
kubectl describe pod -n ark <pod-name>
```

### View logs
```bash
kubectl logs -n ark deployment/ark-api
kubectl logs -n ark-system deployment/ark-controller
```

### Kubeconfig issues with Kind
If kubectl/helm can't reach the cluster API server (connection refused to 127.0.0.1):
```bash
# Re-export kubeconfig with internal Docker network addresses
kind export kubeconfig --name ark-cluster --internal

# Verify the server address is NOT 127.0.0.1
kubectl config view --minify | grep server
# Should show: server: https://ark-cluster-control-plane:6443
```

## Working with Ark

Once Ark is running:

```bash
kubectl apply -f samples/agents/my-agent.yaml

kubectl get agents
kubectl get queries
kubectl get teams

kubectl describe agent <agent-name>
```

## Phoenix Telemetry

Install Phoenix for OpenTelemetry tracing:

```bash
node tools/ark-cli/dist/index.js install marketplace/services/phoenix
```

Access dashboard:
```bash
kubectl port-forward -n phoenix svc/phoenix-svc 6006:6006
# Open http://localhost:6006
```

## Important

**DO NOT use `scripts/quickstart.sh`** - it is deprecated. Always use `ark-cli` as described above.

**DO NOT use `npm install -g @agents-at-scale/ark`** - always build ark-cli from source to match the PR code being tested.
