# OpenTelemetry Integration for claude-code-agent

## Problem Statement

Claude Code CLI and Phoenix (Arize) use different OpenTelemetry signals, making them incompatible out of the box.

### Claude Code CLI Telemetry

Claude Code exports **metrics and logs**, not traces:

- `OTEL_METRICS_EXPORTER` - token usage, cost, duration as time-series metrics
- `OTEL_LOGS_EXPORTER` - events with session metadata

From the [official docs](https://code.claude.com/docs/en/monitoring-usage):

> "Claude Code supports OpenTelemetry (OTel) metrics and events for monitoring and observability. All metrics are time series data exported via OpenTelemetry's standard metrics protocol, and events are exported via OpenTelemetry's logs/events protocol."

Example log output (from [GitHub #2090](https://github.com/anthropics/claude-code/issues/2090)):
```json
{
  "cost_usd": "0.011956950000000001",
  "duration_ms": "11145",
  "input_tokens": "4",
  "output_tokens": "225",
  "model": "claude-sonnet-4-20250514",
  "session.id": "...",
  "user.id": "..."
}
```

### Phoenix (Arize) Telemetry

Phoenix only accepts **traces** (spans):

- Endpoint: `/v1/traces`
- No support for `/v1/metrics` or `/v1/logs`
- Built around OpenTelemetry TracerProvider, SpanProcessor, SpanExporter

From [Phoenix OTEL docs](https://arize.com/docs/phoenix/tracing/how-to-tracing/setup-tracing/setup-using-phoenix-otel):

> "The phoenix.otel module provides drop-in replacements for OpenTelemetry TracerProvider, SimpleSpanProcessor, BatchSpanProcessor, HTTPSpanExporter, and GRPCSpanExporter."

### The Gap

| Signal | Claude Code CLI | Phoenix |
|--------|-----------------|---------|
| Traces | ❌ Not exported | ✅ Supported |
| Metrics | ✅ Exported | ❌ Not supported |
| Logs | ✅ Exported | ❌ Not supported |

## Solution: Add Tracing to claude-code-agent

The `claude-code-agent` is a Node.js wrapper that exposes Claude Code as an A2A server. We can add OpenTelemetry tracing at this layer to capture:

- Request/response lifecycle as spans
- Duration of Claude Code execution
- Token counts and costs (parsed from output)
- Error states
- A2A message metadata

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     claude-code-agent                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              OpenTelemetry Tracing                   │    │
│  │  - Start span on A2A request                        │    │
│  │  - Add attributes (message.id, context.id, model)   │    │
│  │  - End span on response complete                    │    │
│  │  - Export to Phoenix via OTLP/HTTP                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Claude Code CLI                         │    │
│  │  - Executes prompts                                 │    │
│  │  - Exports metrics/logs (separate from traces)      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ OTLP/HTTP traces
┌─────────────────────────────────────────────────────────────┐
│                        Phoenix                               │
│  - Receives traces from claude-code-agent                   │
│  - Visualizes LLM call spans                                │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

#### 1. Dependencies

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/semantic-conventions
```

#### 2. Initialize Tracing (src/tracing.ts)

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export function initTracing() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint || process.env.CLAUDE_CODE_ENABLE_TELEMETRY !== '1') {
    console.log('Tracing disabled (OTEL_EXPORTER_OTLP_ENDPOINT not set or telemetry disabled)');
    return;
  }

  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'claude-code-agent',
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
  });

  sdk.start();
  console.log(`Tracing enabled, exporting to ${endpoint}/v1/traces`);

  process.on('SIGTERM', () => sdk.shutdown());
}
```

#### 3. Instrument A2A Handler

```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('claude-code-agent');

async function handleMessage(message: A2AMessage): Promise<A2AResponse> {
  const span = tracer.startSpan('claude-code.query', {
    attributes: {
      'message.id': message.messageId,
      'context.id': message.contextId,
      'message.role': message.role,
    },
  });

  try {
    const startTime = Date.now();
    const result = await executeClaudeCode(message);
    const duration = Date.now() - startTime;

    span.setAttributes({
      'llm.duration_ms': duration,
      'llm.model': result.model || 'unknown',
      'llm.input_tokens': result.inputTokens || 0,
      'llm.output_tokens': result.outputTokens || 0,
    });

    span.setStatus({ code: SpanStatusCode.OK });
    return result;

  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    span.recordException(error);
    throw error;

  } finally {
    span.end();
  }
}
```

#### 4. Initialize at Startup (src/main.ts)

```typescript
import { initTracing } from './tracing';

// Initialize tracing before anything else
initTracing();

// ... rest of main.ts
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CLAUDE_CODE_ENABLE_TELEMETRY` | Enable tracing (required) | `1` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Phoenix endpoint | `http://phoenix-svc.phoenix:6006` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | Protocol (http/protobuf recommended) | `http/protobuf` |
| `OTEL_SERVICE_NAME` | Service name in traces | `claude-code-agent` |

### Helm Values Example

```yaml
env:
  CLAUDE_CODE_ENABLE_TELEMETRY: "1"
  OTEL_SERVICE_NAME: "claude-code-agent"
  OTEL_EXPORTER_OTLP_PROTOCOL: "http/protobuf"
  OTEL_EXPORTER_OTLP_ENDPOINT: "http://phoenix-svc.phoenix.svc.cluster.local:6006"
```

### Span Attributes

Recommended attributes to capture:

| Attribute | Description |
|-----------|-------------|
| `message.id` | A2A message ID |
| `context.id` | A2A context/conversation ID |
| `message.role` | user/assistant |
| `llm.model` | Model used (e.g., claude-sonnet-4) |
| `llm.input_tokens` | Input token count |
| `llm.output_tokens` | Output token count |
| `llm.duration_ms` | Execution time |
| `llm.cost_usd` | Cost if available |

### Expected Result

After implementation, Phoenix will show:

- One trace per A2A query
- Span duration showing Claude Code execution time
- Attributes with token counts, model, message IDs
- Error traces for failed queries

## References

- [Claude Code Monitoring Docs](https://code.claude.com/docs/en/monitoring-usage)
- [Phoenix OTEL Setup](https://arize.com/docs/phoenix/tracing/how-to-tracing/setup-tracing/setup-using-phoenix-otel)
- [OpenTelemetry JS SDK](https://opentelemetry.io/docs/languages/js/)
- [GitHub Issue #2090](https://github.com/anthropics/claude-code/issues/2090) - Claude Code telemetry limitations
- [GitHub Issue #1712](https://github.com/anthropics/claude-code/issues/1712) - OTEL configuration
