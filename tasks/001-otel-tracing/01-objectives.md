# Task: otel-tracing

Initial request: "Add OpenTelemetry tracing to claude-code-agent so traces are exported to Phoenix (Arize)"

## Status
Phase: Architecture (objectives approved)

## Plan
- [x] 01-objectives - Define why and goals
- [x] 02-acceptance-criteria - Define "done" + verification methods
- [ ] 03-architecture - Design solution
- [ ] 04-verifiable-prototype - Build with checkpoints
- [ ] 05-verification - Prove each criterion with evidence
- [ ] 06-outcome - Document learnings

## Why This Task Matters

Claude Code CLI exports metrics and logs (not traces), but tools like Phoenix only accepts traces. This creates an observability gap when using claude-code-agent with Phoenix for LLM monitoring.

## Current State

**Claude Code CLI Telemetry:**
- Exports metrics via `OTEL_METRICS_EXPORTER` (token usage, cost, duration)
- Exports logs via `OTEL_LOGS_EXPORTER` (events with session metadata)
- Does NOT export traces (spans)

**Phoenix (Arize) Telemetry:**
- Only accepts traces via `/v1/traces` endpoint
- Built around OpenTelemetry TracerProvider/SpanProcessor/SpanExporter
- No support for metrics or logs endpoints

**claude-code-agent:**
- Node.js wrapper exposing Claude Code as an A2A server
- Has OTEL env var logging in `main.ts` but no actual tracing
- Key instrumentation point: `ClaudeCodeExecutor.execute()` in `src/claude-code-executor.ts`

## Goals

### Primary Goals

1. **Add OpenTelemetry tracing**: Initialize OTLP trace exporter at startup
2. **Log incoming A2A requests**: Capture request payload (user message text, task/context IDs) as span attributes
3. **Instrument execution lifecycle**: Wrap each request in a span with timing and LLM-relevant attributes
4. **Export to Phoenix**: Configure OTLP/HTTP export to Phoenix endpoint

### Non-Goals (Follow-on Work)

- Converting Claude Code CLI's native metrics/logs to spans
- Automatic instrumentation of Express HTTP layer
- Distributed tracing correlation with upstream services

## Research Available

| Topic | Artifact |
|-------|----------|
| Problem statement | User's initial request |
| OpenTelemetry JS SDK | https://opentelemetry.io/docs/languages/js/ |
| Phoenix OTEL setup | https://arize.com/docs/phoenix/tracing/how-to-tracing/setup-tracing/setup-using-phoenix-otel |

## Constraints

1. **Opt-in**: Tracing disabled by default, enable via `--experimental-otel-traces` CLI flag or `EXPERIMENTAL_OTEL_TRACES=1` env var
2. **No Phoenix dependency**: Use standard OTLP exporters, not Phoenix-specific SDK
3. **Minimal overhead**: Don't add latency to request processing
4. **Real-time visibility**: Use child spans so traces appear during streaming, not just at completion

## Success Criteria

After this task:
- Incoming A2A request details logged as span attributes (message text, IDs)
- A2A requests create spans with task/context IDs and token counts
- Spans export to Phoenix via OTLP/HTTP when configured
- Tracing is disabled when env vars are not set
