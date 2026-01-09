# Architecture

## High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        claude-code-agent                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    src/tracing.ts                               │     │
│  │  - Initialize NodeSDK with OTLPTraceExporter (protobuf)        │     │
│  │  - Use SimpleSpanProcessor for immediate export                │     │
│  │  - Export getTracer() for use in other modules                 │     │
│  │  - Graceful shutdown on SIGTERM                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │              src/lib/span-transformer.ts                        │     │
│  │                                                                 │     │
│  │  SpanTransformer class:                                        │     │
│  │  - Constructor takes tracer + session context                  │     │
│  │  - onMessage(msg: ClaudeMessage) → creates independent spans   │     │
│  │  - Each span ends immediately → real-time export to Phoenix    │     │
│  │  - Tracks lastOutput for input/output chaining                 │     │
│  │                                                                 │     │
│  │  Span types created:                                           │     │
│  │      • claude-code.init   → CHAIN kind, session start          │     │
│  │      • llm.claude         → LLM kind, assistant text           │     │
│  │      • tool.<name>        → TOOL kind, tool invocation         │     │
│  │      • tool.result        → TOOL kind, tool output             │     │
│  │      • claude-code.result → LLM kind, final result             │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                src/claude-code-executor.ts                      │     │
│  │                                                                 │     │
│  │  executeClaudeCode():                                          │     │
│  │    1. Create SpanTransformer with session context              │     │
│  │    2. On each stdout JSON line:                                │     │
│  │       transformer.onMessage(parsedMsg)                         │     │
│  │    3. On completion/error: transformer.end()                   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    Claude Code CLI                              │     │
│  │  stdout (JSON stream):                                         │     │
│  │    {"type":"system","subtype":"init","session_id":"..."}       │     │
│  │    {"type":"assistant","content":[{"type":"text",...}]}        │     │
│  │    {"type":"assistant","content":[{"type":"tool_use",...}]}    │     │
│  │    {"type":"user","content":[{"type":"tool_result",...}]}      │     │
│  │    {"type":"system","msg_type":"result","result":"..."}        │     │
│  └────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ OTLP/protobuf traces (real-time per span)
┌─────────────────────────────────────────────────────────────────────────┐
│                             Phoenix                                      │
│  Independent spans (no parent hierarchy for real-time export):          │
│    • claude-code.init   [CHAIN] input.value=user_query                  │
│    • llm.claude         [LLM]   input.value=prev, output.value=response │
│    • tool.Bash          [TOOL]  tool.input=args, input.value=args       │
│    • tool.result        [TOOL]  tool.output=result, output.value=result │
│    • claude-code.result [LLM]   output.value=final_response             │
└─────────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── main.ts                    # --experimental-otel-traces flag, init/shutdown
├── tracing.ts                 # SDK initialization, getTracer()
├── lib/
│   └── span-transformer.ts    # Message → Span transformer (SOURCE OF TRUTH for attributes)
└── claude-code-executor.ts    # Integrates SpanTransformer
```

## Input/Output Chaining Behavior

**Important**: The `input.value` and `output.value` attributes use a **chained** approach:

1. First span (`claude-code.init`): `input.value` = original user query
2. LLM spans (`llm.claude`): `input.value` = previous message output
3. Tool call (`tool.<name>`): `input.value` = tool arguments (JSON)
4. Tool result (`tool.result`): `output.value` = tool output, becomes next input
5. Result span: `input.value` = last output in chain

**Why chained?** This makes it easier to visualize the LLM agentic loop - each span shows what it received and what it produced.

**Limitation**: This is NOT the true LLM input/output. The actual input to each LLM inference is the full conversation history, not just the previous message.

**Future enhancement**: Add `OTEL_TRACE_INPUT_MODE` env var:
- `chained` (default): Current behavior - input is previous output
- `full`: Input is entire conversation history (true LLM input)

## Message Type → Span Mapping

| Claude Message | Span Name | OpenInference Kind | Key Attributes |
|----------------|-----------|-------------------|----------------|
| `{type:"system", subtype:"init"}` | `claude-code.init` | `CHAIN` | `session.id`, `input.value` |
| `{type:"assistant", content:[{type:"text"}]}` | `llm.claude` | `LLM` | `input.value`, `output.value`, `llm.model.name` |
| `{type:"assistant", content:[{type:"tool_use"}]}` | *(stored, no span yet)* | - | Stored in `pendingToolCalls` Map |
| `{type:"user", content:[{type:"tool_result"}]}` | `tool.<toolName>` | `TOOL` | `tool.name`, `tool.input`, `tool.output`, `input.value`, `output.value` |
| `{type:"system", msg_type:"result"}` | `claude-code.result` | `LLM` | `input.value`, `output.value`, `llm.duration_ms` |

## Tool Call Correlation

Tool calls arrive in two separate messages that must be correlated:

1. **Assistant message with `tool_use`**: Contains tool name, input args, and unique `id` (e.g., `toolu_01XYZ...`)
2. **User message with `tool_result`**: Contains tool output and `tool_use_id` matching the original `id`

**Implementation**: `SpanTransformer` uses a `pendingToolCalls` Map keyed by tool ID. On `tool_use`, we store the call. On `tool_result`, we look up by `tool_use_id`, create a single span with both input AND output, then delete the pending entry.

This correctly handles multiple concurrent tool calls since each invocation has a unique ID from Claude.

## OpenInference Attributes

Phoenix uses the `openinference.span.kind` attribute to determine span display (icons, I/O tabs).

| Attribute | Values | Purpose |
|-----------|--------|---------|
| `openinference.span.kind` | `CHAIN`, `LLM`, `TOOL`, `AGENT` | Phoenix span categorization |
| `input.value` | string | Displayed in Phoenix Input tab |
| `output.value` | string | Displayed in Phoenix Output tab |
| `tool.name` | string | Tool identifier |
| `tool.input` | string (JSON) | Tool arguments |
| `tool.output` | string | Tool result |
| `llm.model.name` | `claude` | Model identifier |
| `llm.model.provider` | `anthropic` | Provider identifier |
| `session.id` | string | Claude session for multi-turn |

**Source of truth**: See `src/lib/span-transformer.ts` for the complete list of attributes set on each span type.

## Configuration

Tracing is enabled via the config file:

```yaml
otel:
  tracing:
    enabled: true
```

| Config Option | Description | Default |
|---------------|-------------|---------|
| `otel.tracing.enabled` | Enable tracing | `false` |
| `otel.tracing.aggregateSpans` | Aggregate into single parent span | `false` |
| `otel.tracing.inputMode` | Input chaining mode (`chained` or `full`) | `chained` |

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector endpoint (required when tracing enabled) | `http://localhost:6006` |
| `OTEL_SERVICE_NAME` | Service name in traces | `claude-code-agent` |

## Dependencies

```json
{
  "@opentelemetry/api": "^1.9.0",
  "@opentelemetry/sdk-node": "^0.57.0",
  "@opentelemetry/exporter-trace-otlp-proto": "^0.57.0",
  "@opentelemetry/resources": "^1.30.0",
  "@opentelemetry/semantic-conventions": "^1.28.0"
}
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Independent spans (no parent) | Phoenix doesn't show incomplete traces; independent spans export in real-time |
| SimpleSpanProcessor | Immediate export for real-time visibility |
| OTLP/protobuf | Phoenix expects protobuf, not JSON |
| Chained input/output | Easier to visualize agentic loop (trade-off: not true LLM I/O) |
| Truncate to 1000 chars | Avoid bloating spans with full file contents |
| Both `tool.*` and `input/output.value` | Compatibility with both ark conventions and Phoenix UI |

## Screenshots

### Session Overview

![Phoenix session view](./images/otel-claude-session.png)

### Tool Call Detail

![Phoenix tool call detail](./images/otel-claude-tool-call.png)
