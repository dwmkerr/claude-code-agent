# Verifiable Prototype

Building incrementally. Each step has a checkpoint with verification criteria.

## Prerequisites: Run Phoenix Locally

Easiest way to run Phoenix for local testing:

```bash
# Option 1: Docker (recommended)
docker run -p 6006:6006 arizephoenix/phoenix:latest

# Option 2: Python pip
pip install arize-phoenix
phoenix serve --port 6006
```

Phoenix UI: http://localhost:6006

---

## Step 1: End-to-end Data Flow

Install dependencies, create tracing infrastructure, integrate with executor, and verify spans flow to Phoenix.

### 1.1 Add OpenTelemetry dependencies

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/resources @opentelemetry/semantic-conventions
```

### 1.2 Create src/tracing.ts

Initialize OpenTelemetry SDK with SimpleSpanProcessor for immediate export.

```typescript
// src/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { trace, Tracer } from '@opentelemetry/api';

let sdk: NodeSDK | null = null;

export function initTracing(): boolean {
  if (process.env.EXPERIMENTAL_OTEL_TRACES !== '1') {
    return false;
  }

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    console.warn('EXPERIMENTAL_OTEL_TRACES=1 but OTEL_EXPORTER_OTLP_ENDPOINT not set');
    return false;
  }

  const exporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
  });

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'claude-code-agent',
    }),
    spanProcessor: new SimpleSpanProcessor(exporter),
  });

  sdk.start();
  return true;
}

export function getTracer(): Tracer {
  return trace.getTracer('claude-code-agent');
}

export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
  }
}
```

### 1.3 Create src/lib/span-transformer.ts

Transform Claude messages into OTEL spans in real-time.

```typescript
// src/lib/span-transformer.ts
import { Tracer, Span, SpanStatusCode, context, trace } from '@opentelemetry/api';

interface SessionContext {
  taskId: string;
  contextId: string;
  messageId: string;
  userText: string;
}

interface ClaudeMessage {
  type: string;
  subtype?: string;
  msg_type?: string;
  session_id?: string;
  result?: string;
  content?: Array<{
    type: string;
    text?: string;
    name?: string;
    input?: any;
    tool_use_id?: string;
    content?: string;
  }>;
}

export class SpanTransformer {
  private tracer: Tracer;
  private parentSpan: Span;
  private parentContext: any;
  private sessionContext: SessionContext;
  private startTime: number;

  constructor(tracer: Tracer, sessionContext: SessionContext) {
    this.tracer = tracer;
    this.sessionContext = sessionContext;
    this.startTime = Date.now();

    // Create parent span for entire query
    this.parentSpan = this.tracer.startSpan('claude-code.query', {
      attributes: {
        'a2a.task.id': sessionContext.taskId,
        'a2a.context.id': sessionContext.contextId,
        'a2a.message.id': sessionContext.messageId,
        'llm.request.text': this.truncate(sessionContext.userText, 500),
      },
    });
    this.parentContext = trace.setSpan(context.active(), this.parentSpan);
  }

  onMessage(msg: ClaudeMessage): void {
    // Create child span in parent context
    const childSpan = this.tracer.startSpan(
      this.getSpanName(msg),
      { attributes: this.getAttributes(msg) },
      this.parentContext
    );
    childSpan.end(); // End immediately for real-time export
  }

  end(error?: Error): void {
    const duration = Date.now() - this.startTime;
    this.parentSpan.setAttribute('llm.duration_ms', duration);

    if (error) {
      this.parentSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      this.parentSpan.recordException(error);
    } else {
      this.parentSpan.setStatus({ code: SpanStatusCode.OK });
    }

    this.parentSpan.end();
  }

  private getSpanName(msg: ClaudeMessage): string {
    if (msg.type === 'system') {
      if (msg.subtype === 'init') return 'claude-code.init';
      if (msg.msg_type === 'result') return 'claude-code.result';
      return 'claude-code.system';
    }
    if (msg.type === 'assistant') {
      const content = msg.content?.[0];
      if (content?.type === 'tool_use') return 'claude-code.tool_use';
      return 'claude-code.assistant';
    }
    if (msg.type === 'user') {
      const content = msg.content?.[0];
      if (content?.type === 'tool_result') return 'claude-code.tool_result';
      return 'claude-code.user';
    }
    return 'claude-code.unknown';
  }

  private getAttributes(msg: ClaudeMessage): Record<string, string | number> {
    const attrs: Record<string, string | number> = {
      'message.type': msg.type,
    };

    if (msg.subtype) attrs['message.subtype'] = msg.subtype;
    if (msg.session_id) attrs['session.id'] = msg.session_id;
    if (msg.result) attrs['llm.response.text'] = this.truncate(msg.result, 500);

    const content = msg.content?.[0];
    if (content) {
      if (content.type === 'text' && content.text) {
        attrs['llm.response.text'] = this.truncate(content.text, 500);
      }
      if (content.type === 'tool_use') {
        attrs['tool.name'] = content.name || 'unknown';
        attrs['tool.input'] = this.truncate(JSON.stringify(content.input), 200);
      }
      if (content.type === 'tool_result') {
        attrs['tool.id'] = content.tool_use_id || 'unknown';
        attrs['tool.output'] = this.truncate(content.content || '', 200);
      }
    }

    return attrs;
  }

  private truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  }
}
```

### 1.4 Integrate into main.ts

- Add `--experimental-otel-traces` CLI flag
- Call `initTracing()` before server starts
- Call `shutdownTracing()` on SIGTERM
- Add `dev:otel-traces` npm script

### 1.5 Integrate into claude-code-executor.ts

- Create SpanTransformer for each `execute()` call
- Call `transformer.onMessage(msg)` for each JSON line from stdout
- Call `transformer.end()` on completion or `transformer.end(error)` on failure

### Checkpoint 1: Verify Data Flow

```bash
# Terminal 1: Start Phoenix
docker run -p 6006:6006 arizephoenix/phoenix:latest

# Terminal 2: Start agent with tracing
EXPERIMENTAL_OTEL_TRACES=1 \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:6006 \
npm run dev:otel-traces

# Terminal 3: Send test request
curl -X POST http://localhost:2222/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"message/send","params":{"message":{"role":"user","parts":[{"kind":"text","text":"What is 2+2?"}]}}}'
```

**Verification:**
- [ ] `npm run build` succeeds
- [ ] Server starts with "Experimental OTEL traces enabled" log
- [ ] Phoenix UI at http://localhost:6006 shows traces
- [ ] Parent span `claude-code.query` visible with request text
- [ ] Child spans appear during execution (not just at end)
- [ ] Child spans show tool names, message types
- [ ] Error requests show error status on spans

---

## Step 2: Polish and Edge Cases

Refine based on Step 1 learnings.

**Checkpoint 2:**
- [ ] Handle malformed JSON gracefully (no crash)
- [ ] Handle missing OTEL endpoint gracefully (warning, continue without tracing)
- [ ] Truncation works correctly for large tool outputs
- [ ] Multiple concurrent requests create separate traces

---

## Step 3: Documentation

Create `docs/otel.md` and update README.

### docs/otel.md

Standalone guide covering:
- What this feature does (real-time spans for Claude messages)
- Environment variables reference
- Quick start with Phoenix (Docker one-liner)
- Example trace output / what to expect in Phoenix UI
- Troubleshooting common issues

### README updates

- Add link to `docs/otel.md` in features section
- Mention `--experimental-otel-traces` flag

### Helm chart

- Add example OTEL config in values.yaml comments

**Checkpoint 3:**
- [ ] `docs/otel.md` exists with quick start guide
- [ ] README links to docs/otel.md
- [ ] Helm chart values.yaml has example OTEL config
