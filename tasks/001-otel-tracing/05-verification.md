# Verification

> Stub - to be filled in after prototype is complete.

Maps trust plan and criteria to evidence.

## Trust Evidence

| Trust Method | Evidence |
|--------------|----------|
| Acceptance criteria verified | See below |
| Spans visible in Phoenix UI | Screenshot of Phoenix trace view |

## Criteria

### Tracing Initialization

| Criterion | Evidence | Status |
|-----------|----------|--------|
| CLI flag enables tracing | | pending |
| Env var enables tracing | | pending |
| Tracing disabled when not set | | pending |
| Service name configurable | | pending |

### Real-time Span Visibility

| Criterion | Evidence | Status |
|-----------|----------|--------|
| Parent span created on request | | pending |
| Request child span exports immediately | | pending |
| Streaming child span exports during stream | | pending |
| Response child span exports with response | | pending |

### A2A Request Logging

| Criterion | Evidence | Status |
|-----------|----------|--------|
| Span includes a2a.task.id | | pending |
| Span includes a2a.context.id | | pending |
| Span includes a2a.message.id | | pending |
| Span includes a2a.message.role | | pending |
| Span includes llm.request.text | | pending |

### Span Attributes (Response)

| Criterion | Evidence | Status |
|-----------|----------|--------|
| Span includes llm.model | | pending |
| Span includes llm.duration_ms | | pending |
| Span includes llm.input_tokens | | pending |
| Span includes llm.output_tokens | | pending |
| Span includes llm.response.text | | pending |

### Export to Phoenix

| Criterion | Evidence | Status |
|-----------|----------|--------|
| Spans export via OTLP/HTTP | | pending |
| Endpoint configurable | | pending |
| Protocol supports http/protobuf | | pending |

### Error Handling

| Criterion | Evidence | Status |
|-----------|----------|--------|
| Failed requests create error spans | | pending |
| Span status set to ERROR | | pending |
| Exception recorded on span | | pending |

### Code Quality

| Criterion | Evidence | Status |
|-----------|----------|--------|
| TypeScript compiles | | pending |
| No hardcoded secrets | | pending |
| SDK shuts down gracefully | | pending |

## Gaps

- (To be documented during verification)
