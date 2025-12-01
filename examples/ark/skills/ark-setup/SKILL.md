---
name: Ark Setup
description: Set up and install the Ark platform from source. Use this skill when the user wants to install, deploy, or configure Ark in their local Kubernetes cluster.
---

# Ark Setup

This skill helps you set up and install the Ark platform from source.

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
3. **Node.js** - For building the ark-cli tool
4. **devspace** - For deploying Ark services

## Step 1: Clone the Ark repository

First, ensure you have cloned the Ark repository. If the user provided an org/repo, use that. Otherwise, use the default:

```bash
git clone git@github.com:mckinsey/agents-at-scale-ark.git
cd agents-at-scale-ark
```

If working on a pull request, checkout the PR branch:

```bash
git fetch origin pull/<PR_NUMBER>/head:<BRANCH_NAME>
git checkout <BRANCH_NAME>
```

## Step 2: Set up Kubernetes cluster

If you don't have a Kubernetes cluster running, create one with Kind:

```bash
# Create a Kind cluster
kind create cluster --name ark

# Verify cluster is ready
kubectl cluster-info
```

## Step 3: Build the ark-cli

The ark-cli tool is used to check installation status and manage Ark:

```bash
cd agents-at-scale-ark/tools/ark-cli
npm install
npm run build
```

You can then use the cli from within the `tools/ark-cli` directory:

```bash
node dist/index.js status
```

## Step 4: Deploy Ark

Return to the cloned Ark repository root directory and deploy using devspace:

```bash
cd agents-at-scale-ark
devspace deploy
```

**Note:** Always return to the `agents-at-scale-ark` directory when running devspace or other Ark commands.

This deploys all Ark services to your Kubernetes cluster.

## Step 5: Monitor installation

Ark installation can take **up to 15 minutes** as it pulls images and initializes services.

Check installation status using the ark-cli:

```bash
ark status
```

Or use kubectl directly:

```bash
kubectl get pods -n ark
kubectl get pods --all-namespaces | grep ark
```

Wait until all services show as **Ready**.

```bash
# Check all pods are running
kubectl get pods -n ark

# Check ark services
kubectl get services -n ark

# View ark-api logs
kubectl logs -n ark deployment/ark-api

# Test the API endpoint (if exposed)
kubectl port-forward svc/ark-api 8080:80
curl http://localhost:8080/health
```

## Troubleshooting

Check pod status:
```bash
# Note that the ark controller is in namespace 'ark-system' and ark tenant resources are in the namespace 'default'
kubectl get pods -A -o wide
```

## Working with Ark

Once Ark is running, you can use `kubectl`:

```bash
kubectl apply -f samples/agents/my-agent.yaml

kubectl get agents
kubectl get queries
kubectl get teams

kubectl describe agent <agent-name>
kubectl describe query <query-name>

kubectl delete agent <agent-name>
kubectl delete query <query-name>
```

## Phoenix Telemetry

Install Phoenix for OpenTelemetry tracing:

```bash
ark install marketplace/services/phoenix
```

Check status:
```bash
kubectl get pods -n phoenix
```

Access dashboard:
```bash
kubectl port-forward -n phoenix svc/phoenix-svc 6006:6006
# Open http://localhost:6006
```
