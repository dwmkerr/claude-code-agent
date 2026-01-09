# Acceptance Criteria

## Trust

How can we build trust in this process and these learnings?

- Acceptance criteria with verification method for each
- Spans visible in Phoenix UI after sending A2A request
- Working prototype demonstrates end-to-end flow

## Research Available

| Question | Answer | Artifact |
|----------|--------|----------|
| What signals does Claude Code export? | Metrics + Logs, not traces | Claude Code docs |
| What signals does Phoenix accept? | Traces only | Phoenix OTEL docs |
| Where to instrument? | `ClaudeCodeExecutor.execute()` | Code review of `src/claude-code-executor.ts` |

## Criteria

### Tracing Initialization

| Criterion | Verification Method |
|-----------|---------------------|
| `--experimental-otel-traces` CLI flag enables tracing | Startup logs show "Experimental OTEL traces enabled" |
| `EXPERIMENTAL_OTEL_TRACES=1` env var enables tracing | Startup logs show "Experimental OTEL traces enabled" |
| Tracing stays disabled when flag/env not set | No tracing SDK loaded, no startup message |
| Service name configurable via `OTEL_SERVICE_NAME` | Span shows custom service name in Phoenix |

### Real-time Span Visibility

| Criterion | Verification Method |
|-----------|---------------------|
| Parent span `claude-code.query` created on request | Phoenix shows parent span |
| Child span `claude-code.request` exports when request sent | Span visible in Phoenix before response completes |
| Child span `claude-code.streaming` exports when streaming starts | Span visible during streaming |
| Child span `claude-code.response` exports with final response | Span visible with response attributes |

### A2A Request Logging

| Criterion | Verification Method |
|-----------|---------------------|
| Span includes `a2a.task.id` | Phoenix trace view shows attribute |
| Span includes `a2a.context.id` | Phoenix trace view shows attribute |
| Span includes `a2a.message.id` | Phoenix trace view shows attribute |
| Span includes `a2a.message.role` | Phoenix trace view shows attribute |
| Span includes `llm.request.text` (user message) | Phoenix trace view shows truncated text |

### Span Attributes (Response)

| Criterion | Verification Method |
|-----------|---------------------|
| Span includes `llm.model` | Phoenix trace view shows attribute |
| Span includes `llm.duration_ms` | Phoenix trace view shows attribute |
| Span includes `llm.input_tokens` (when available) | Phoenix trace view shows attribute |
| Span includes `llm.output_tokens` (when available) | Phoenix trace view shows attribute |
| Span includes `llm.response.text` (truncated) | Phoenix trace view shows truncated response |

### Export to Phoenix

| Criterion | Verification Method |
|-----------|---------------------|
| Spans export via OTLP/HTTP | `curl` to Phoenix shows trace |
| Endpoint configurable via `OTEL_EXPORTER_OTLP_ENDPOINT` | Change endpoint, spans arrive at new location |
| Protocol supports http/protobuf | Set `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`, spans export |

### Error Handling

| Criterion | Verification Method |
|-----------|---------------------|
| Failed requests create error spans | Send bad request, Phoenix shows error span |
| Span status set to ERROR on failure | Phoenix span status is red/error |
| Exception recorded on span | Phoenix shows exception details |

### Code Quality

| Criterion | Verification Method |
|-----------|---------------------|
| TypeScript compiles without errors | `npm run build` succeeds |
| No hardcoded secrets or endpoints | Code review |
| SDK shuts down gracefully on SIGTERM | Process exits cleanly, spans flushed |

## Out of Scope (Follow-on Tasks)

- Parsing token counts from Claude Code JSON output (stub with 0 for now)
- Adding span events for intermediate tool calls
- Helm chart environment variable documentation

## Definition of Done

1. Tracing code merged to main branch
2. Phoenix shows traces for A2A requests
3. All acceptance criteria verified with evidence
