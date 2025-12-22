ROOT_DIR := $(shell cd ../.. && pwd)

default: help

.PHONY: help
help: # Show help for each of the Makefile recipes.
	@grep -E '^[a-zA-Z0-9 -]+:.*#'  Makefile | sort | while read -r l; do printf "\033[1;32m$$(echo $$l | cut -f 1 -d':')\033[00m:$$(echo $$l | cut -f 2- -d'#')\n"; done

.PHONY: docker-build
docker-build: # Build the claude-code-agent Docker image.
	cd $(ROOT_DIR) && docker build -t claude-code-agent .

.PHONY: kind-cleanup
kind-cleanup: # Delete ALL existing Kind clusters to avoid conflicts.
	kind get clusters 2>/dev/null | xargs -I {} kind delete cluster --name {} 2>/dev/null || true

.PHONY: docker-run
docker-run: docker-build kind-cleanup # Run the agent with DinD for Kind cluster support.
	# Register this agent with Ark in the outer cluster
	kubectl apply -f $(ROOT_DIR)/examples/ark/manifests/a2aserver.yaml
	# Create network and start DinD container
	docker network create ark-agent-net 2>/dev/null || true
	docker rm -f ark-dind 2>/dev/null || true
	docker run -d --privileged --name ark-dind --network ark-agent-net \
		-e DOCKER_TLS_CERTDIR="" \
		docker:dind
	# Wait for DinD to be ready
	@echo "Waiting for DinD to start..."
	@sleep 3
	# Run the agent connected to DinD
	docker run --rm -it --init --network ark-agent-net \
		-v $(ROOT_DIR)/.env:/app/.env:ro \
		-v $(ROOT_DIR)/examples/ark/workspace:/workspace \
		-v $(ROOT_DIR)/examples/ark/claude-defaults:/home/claude-code-agent/.claude-defaults:ro \
		-v $(ROOT_DIR)/examples/ark/mcp-config.json:/config/mcp-config.json:ro \
		-e DOCKER_HOST=tcp://ark-dind:2375 \
		-e CLAUDE_LOG_PATH=/tmp/claude-code-agent-log.jsonl \
		-e CLAUDE_AGENT_NAME=ark-claude-code-agent \
		-p 2222:2222 claude-code-agent --claude-defaults-dir /home/claude-code-agent/.claude-defaults -- --mcp-config /config/mcp-config.json --dangerously-skip-permissions
	# Cleanup DinD on exit
	docker rm -f ark-dind 2>/dev/null || true

.PHONY: docker-cleanup
docker-cleanup: # Clean up DinD container and network.
	docker rm -f ark-dind 2>/dev/null || true
	docker network rm ark-agent-net 2>/dev/null || true

.PHONY: k8s-configmaps
k8s-configmaps: # Create ConfigMaps from local files for Claude config.
	kubectl create configmap ark-mcp-config --from-file=mcp-config.json -o yaml --dry-run=client | kubectl apply -f -
	kubectl create configmap ark-skill-setup --from-file=claude-defaults/skills/ark-setup/ -o yaml --dry-run=client | kubectl apply -f -
	kubectl create configmap ark-skill-testing --from-file=claude-defaults/skills/ark-testing/ -o yaml --dry-run=client | kubectl apply -f -
	kubectl create configmap ark-skill-analysis --from-file=claude-defaults/skills/ark-analysis/ -o yaml --dry-run=client | kubectl apply -f -
	kubectl create configmap ark-claude-defaults --from-file=claude-defaults/CLAUDE.md -o yaml --dry-run=client | kubectl apply -f -

.PHONY: helm-install
helm-install: k8s-configmaps # Deploy to Kubernetes with Helm.
	# Register A2AServer with Ark
	kubectl apply -f manifests/a2aserver.yaml
	# Install/upgrade Helm chart
	helm upgrade --install ark-agent $(ROOT_DIR)/chart -f values.yaml --set apiKey=$(ANTHROPIC_API_KEY)

.PHONY: helm-uninstall
helm-uninstall: # Remove Helm deployment and ConfigMaps.
	helm uninstall ark-agent || true
	kubectl delete configmap ark-mcp-config ark-skill-setup ark-skill-testing ark-skill-analysis ark-claude-defaults || true
	kubectl delete -f manifests/a2aserver.yaml || true
