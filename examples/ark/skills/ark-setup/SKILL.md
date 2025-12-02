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

If you don't have a Kubernetes cluster running, create one with Kind:

```bash
kind create cluster --name ark-cluster
kubectl cluster-info
```

**Note for Docker-in-Docker:** If running inside a container with Kind, you may need to use `kind get kubeconfig --internal` and update the server address, or run commands via `docker exec <kind-node>`.

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

### Kubeconfig issues with Kind in Docker
If kubectl/helm can't reach the cluster API server:
```bash
# Get internal kubeconfig
kind get kubeconfig --name ark-cluster --internal > ~/.kube/config

# Or run commands inside the Kind node
docker exec ark-cluster-control-plane kubectl get pods -A
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
