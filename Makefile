default: help

.PHONY: help
help: # Show help for each of the Makefile recipes.
	@grep -E '^[a-zA-Z0-9 -]+:.*#'  Makefile | sort | while read -r l; do printf "\033[1;32m$$(echo $$l | cut -f 1 -d':')\033[00m:$$(echo $$l | cut -f 2- -d'#')\n"; done

.PHONY: dev
dev: # Run development server with hot-reload.
	npm run dev

.PHONY: dev-safe
dev-safe: # Run dev server with isolated environment (safer).
	env -i PATH="$$PATH" HOME="$$HOME" ANTHROPIC_API_KEY="$$ANTHROPIC_API_KEY" npm run dev

.PHONY: build
build: # Build the project.
	npm run build

.PHONY: test
test: # Run tests.
	npm test

.PHONY: lint
lint: # Run linter.
	npm run lint

.PHONY: docker-build
docker-build: # Build the Docker image.
	docker build -t claude-code-agent .

.PHONY: docker-run
docker-run: docker-build # Build and run the Docker container.
	docker run --rm -it --init -v $(PWD)/.env:/app/.env:ro -v $(PWD)/workspace:/workspace -p 2222:2222 claude-code-agent

.PHONY: docker-run-ark
docker-run-ark: docker-build # Run with Ark skills and Docker socket for Kind. See examples/ark/
	# --user root: Required for Docker socket access. On macOS Docker Desktop,
	# --group-add doesn't work; on Linux, root avoids needing to detect the
	# socket's group ID. Kind also requires elevated permissions.
	docker run --rm -it --init \
		--user root \
		-v $(PWD)/.env:/app/.env:ro \
		-v $(PWD)/workspace:/workspace \
		-v $(PWD)/examples/ark/skills:/root/.claude/skills:ro \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-p 2222:2222 claude-code-agent
