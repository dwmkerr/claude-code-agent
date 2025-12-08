# Changelog

## [0.1.2](https://github.com/dwmkerr/claude-code-agent/compare/v0.1.1...v0.1.2) (2025-12-08)


### Features

* add ark example with Kind and chart extension points ([073b63f](https://github.com/dwmkerr/claude-code-agent/commit/073b63f9b727a1102575d3b890f6f0164ce60671))
* add configurable workspace directory ([687f05d](https://github.com/dwmkerr/claude-code-agent/commit/687f05d62cd68c3019034b95c390cfe1f2dd66ba))
* add configurable workspace directory ([fca80a8](https://github.com/dwmkerr/claude-code-agent/commit/fca80a866b2032b4283a2467b2cb0501d2ae09b6))
* add MCP server configuration support ([#8](https://github.com/dwmkerr/claude-code-agent/issues/8)) ([d9f1322](https://github.com/dwmkerr/claude-code-agent/commit/d9f1322a1de8782be44366d5a881ad6df3e89f89))
* ark skills ([8204364](https://github.com/dwmkerr/claude-code-agent/commit/82043647379df6795424990672bca51861976bc0))
* improve Helm chart and DevSpace configuration ([#10](https://github.com/dwmkerr/claude-code-agent/issues/10)) ([c609a45](https://github.com/dwmkerr/claude-code-agent/commit/c609a45ead0fa468bec89947c994e86b83796260))
* Kubernetes and Playwright support with Kind clusters ([#11](https://github.com/dwmkerr/claude-code-agent/issues/11)) ([1c1f7b2](https://github.com/dwmkerr/claude-code-agent/commit/1c1f7b2f8a3d5515c9180dc2cdf951590be95b95))
* proxy a2a agent in ark to docker on host ([#7](https://github.com/dwmkerr/claude-code-agent/issues/7)) ([9e51d6e](https://github.com/dwmkerr/claude-code-agent/commit/9e51d6e26991ca6144ed71117f4646a4cfa69e42))
* show assistant text messages in white for visibility ([b9d3f8e](https://github.com/dwmkerr/claude-code-agent/commit/b9d3f8e20d45933f772c055e49fc7248071ee1d8))
* skills demos ([e9560c2](https://github.com/dwmkerr/claude-code-agent/commit/e9560c2eed0472685fe3c62f422e19a8375db9dd))
* use terminal width for dynamic line truncation ([cdb37a1](https://github.com/dwmkerr/claude-code-agent/commit/cdb37a1888f126bcd1aa45e3f22ebcb3f034e639))


### Bug Fixes

* account for external indent in line truncation ([d5728c4](https://github.com/dwmkerr/claude-code-agent/commit/d5728c40ee5685975a95e04fc0cfe83cdfb07e18))
* add Docker CLI to image for Kind support ([1d6495b](https://github.com/dwmkerr/claude-code-agent/commit/1d6495b6d6765c397002c7a9b0735cdfa5f5a886))
* add Helm and netstat to container, use direct binary install ([f5803a3](https://github.com/dwmkerr/claude-code-agent/commit/f5803a3f49e1c53ac889bb11f7cde5c196a7aeb2))
* add Skill to default allowed tools ([0087133](https://github.com/dwmkerr/claude-code-agent/commit/0087133b91b01ec50bd1f5be98a71bff72586ea8))
* consistent 60 char preview for Executing/Response/Error logs ([5958066](https://github.com/dwmkerr/claude-code-agent/commit/5958066737ae28bdbf34137a932a01f05e68dbf6))
* improve Kind cluster setup for containerized environments ([#6](https://github.com/dwmkerr/claude-code-agent/issues/6)) ([4a9a261](https://github.com/dwmkerr/claude-code-agent/commit/4a9a261b0217d7a38936c1cd7480250f4aaa59c5))
* make docker-run-ark work on macOS and Linux ([b9b14e4](https://github.com/dwmkerr/claude-code-agent/commit/b9b14e4c724fc6c911bf91820ab41d6c62008186))
* pre-create ~/.claude directory for Claude Code state ([945d58e](https://github.com/dwmkerr/claude-code-agent/commit/945d58e37a56692ea8f487397f642200a513bc28))
* specify container for devspace dev with ark profile ([1aca6d3](https://github.com/dwmkerr/claude-code-agent/commit/1aca6d3358dff23ff35d8e25d19e510b2bee93d7))

## [0.1.1](https://github.com/dwmkerr/claude-code-agent/compare/v0.1.0...v0.1.1) (2025-11-28)


### Miscellaneous Chores

* release 0.1.1 ([5da8021](https://github.com/dwmkerr/claude-code-agent/commit/5da80211ee349aa9452a9200f7999f8cf5715338))

## 0.1.0 (2025-11-27)


### Features

* initial release ([64338e4](https://github.com/dwmkerr/claude-code-agent/commit/64338e4c3a7f5e3c83c7f6f493f2c89d7fa79cb9))
* restructure helm chart with A2AServer and port 2222 ([ae27de9](https://github.com/dwmkerr/claude-code-agent/commit/ae27de9d542d24fd768e1b50e88a5521f170a884))
* show tool_result content preview in logs ([d078da6](https://github.com/dwmkerr/claude-code-agent/commit/d078da686dbde4548f25f3417628664c639aaf54))


### Bug Fixes

* add eslint config ([2e2e18f](https://github.com/dwmkerr/claude-code-agent/commit/2e2e18f1ef1583c6678de8152ee8c7177ae4ab3a))
* simplify dockerfile by copying tsconfig before npm ci ([604fb5d](https://github.com/dwmkerr/claude-code-agent/commit/604fb5d64d5bc4622ff6b93f6dbba0279497a2d6))
* upgrade eslint to v9 with flat config ([de4706d](https://github.com/dwmkerr/claude-code-agent/commit/de4706de2a4ed4f4da82c1af7647ebc97058f008))
* use --ignore-scripts in docker build to avoid premature tsc ([fd8cf5c](https://github.com/dwmkerr/claude-code-agent/commit/fd8cf5ca8e22636c1ef8f134998c9fb77423609e))
* use helm chart instead of manifests in devspace ([f62fd8d](https://github.com/dwmkerr/claude-code-agent/commit/f62fd8d7157640beb0dcdc7fc4c8562686747f01))
* use multi-stage docker build for typescript compilation ([c7134e9](https://github.com/dwmkerr/claude-code-agent/commit/c7134e905fd8f15187b68336d8aab10db53677d2))


### Miscellaneous Chores

* release 0.1.0 ([dab94ff](https://github.com/dwmkerr/claude-code-agent/commit/dab94ffe6cbf046c92b882481189a5bf7feece2d))
