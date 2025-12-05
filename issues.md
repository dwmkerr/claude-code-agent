# Issues

## Overall

- [ ] richer examples directory showing how to install / configure
- [ ] ark screenshot sample via ark cli
- [ ] show issue https://github.com/mckinsey/agents-at-scale-ark/pull/524 using skills with phoenix
- [ ] build feature for issue https://github.com/mckinsey/agents-at-scale-ark/issues/530

## Sessions

- [ ] properly track session id
- [ ] run one process/pwd per session for slightly better isolation - clear docs that separate containers per session is safer

## Config

- [ ] Append system prompt: https://code.claude.com/docs/en/cli-reference

## Skills

- [ ] ensure `make docker-run` mounts skills
- [ ] phoenix skill
- [ ] maybe more configurable with --skills-dir or something, opt-in for ark skills, document how to customise

## Tooling

- [ ] extensible docuker image

## Config

- [ ] easier way to install additional tools such as 'wget'? Offer apt?
- [ ] examples of appending system prompt

## Output

- [ ] fit log output to terminal width (accounting for ANSI color codes)

## CLI

- [ ] pass-through Claude args via `--` or `CLAUDE_ARGS` env var

## Persistence

- [ ] basic setup for local/docker/helm

## Deployment

- [ ] helm chart auto docs
   Install with helm (from repo root).
  Note: Skills and MCP config need to be provided via ConfigMap or mounted volume.
  More deta
  helm install claude-code-agent ../../chart \
  -f values-dind.yaml \
  --set apiKey=$ANTHROPIC_API_KEY


## Testing

- [ ] Playwright config / skills
