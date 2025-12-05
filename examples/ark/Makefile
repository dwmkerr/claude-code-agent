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
docker-run: docker-build kind-cleanup # Run the agent with Ark skills, MCP config, and Docker socket for Kind.
	# Register this agent with Ark in the outer cluster
	kubectl apply -f $(ROOT_DIR)/examples/ark/manifests/a2aserver.yaml
	# --user root: Required for Docker socket access. On macOS Docker Desktop,
	# --group-add doesn't work; on Linux, root avoids needing to detect the
	# socket's group ID. Kind also requires elevated permissions.
	# Mounts:
	# - the local .env file
	# - our local workspace, to see claude's filesystem
	# - skills / CLAUDE.md instructions
	# - MCP config, mounted read-only and passed via --mcp-config
	docker run --rm -it --init \
		--user root \
		-v $(ROOT_DIR)/.env:/app/.env:ro \
		-v $(ROOT_DIR)/examples/ark/workspace:/workspace \
		-v $(ROOT_DIR)/examples/ark/claude/skills:/home/ark/.claude/skills:ro \
		-v $(ROOT_DIR)/examples/ark/claude/CLAUDE.md:/home/ark/.claude/CLAUDE.md:ro \
		-v $(ROOT_DIR)/examples/ark/mcp-config.json:/config/mcp-config.json:ro \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-e CLAUDE_LOG_PATH=/tmp/claude-code-agent-log.jsonl \
		-e CLAUDE_AGENT_NAME=ark-claude-code-agent \
		-p 2222:2222 claude-code-agent -- --mcp-config /config/mcp-config.json
