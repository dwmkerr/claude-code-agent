import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { trace, Tracer } from '@opentelemetry/api';
import pkg from '../package.json' with { type: 'json' };

let sdk: NodeSDK | null = null;

export function isTracingEnabled(): boolean {
  return process.env.EXPERIMENTAL_OTEL_TRACES === '1';
}

export function initTracing(): void {
  if (!isTracingEnabled()) {
    return;
  }

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    console.warn('EXPERIMENTAL_OTEL_TRACES=1 but OTEL_EXPORTER_OTLP_ENDPOINT not set, tracing disabled');
    return;
  }

  const traceExporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
  });

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'claude-code-agent',
    [ATTR_SERVICE_VERSION]: pkg.version,
  });

  sdk = new NodeSDK({
    resource,
    spanProcessor: new SimpleSpanProcessor(traceExporter),
  });

  sdk.start();
}

export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}

export function getTracer(): Tracer {
  return trace.getTracer('claude-code-agent', pkg.version);
}
