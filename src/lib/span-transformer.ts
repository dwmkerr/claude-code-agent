import { Tracer } from '@opentelemetry/api';

const MAX_ATTR_LENGTH = 1000;

function truncate(text: string | undefined, maxLen = MAX_ATTR_LENGTH): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export interface SessionContext {
  taskId: string;
  contextId: string;
  messageId: string;
  userText: string;
}

interface ContentItem {
  type: string;
  text?: string;
  name?: string;
  id?: string;
  input?: unknown;
  content?: string | Array<{ type: string; text?: string }>;
  tool_use_id?: string;
}

export interface ClaudeMessage {
  type: string;
  subtype?: string;
  msg_type?: string;
  content?: ContentItem[];
  message?: {
    content?: ContentItem[];
  };
  result?: string;
  session_id?: string;
  is_error?: boolean;
  duration_ms?: number;
  duration_api_ms?: number;
}

interface PendingToolCall {
  toolName: string;
  toolInput: string;
  timestamp: number;
}

export class SpanTransformer {
  private tracer: Tracer;
  private sessionContext: SessionContext;
  private sessionId?: string;
  private lastOutput?: string;
  private pendingToolCalls: Map<string, PendingToolCall> = new Map();

  constructor(tracer: Tracer, sessionContext: SessionContext) {
    this.tracer = tracer;
    this.sessionContext = sessionContext;
    this.lastOutput = sessionContext.userText;
  }

  onMessage(msg: ClaudeMessage): void {
    if (msg.type === 'system') {
      this.handleSystemMessage(msg);
    } else if (msg.type === 'assistant') {
      this.handleAssistantMessage(msg);
    } else if (msg.type === 'user') {
      this.handleUserMessage(msg);
    }
  }

  private baseAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {
      'task.id': this.sessionContext.taskId,
      'context.id': this.sessionContext.contextId,
      'message.id': this.sessionContext.messageId,
    };
    if (this.sessionId) {
      attrs['session.id'] = this.sessionId;
    }
    return attrs;
  }

  private handleSystemMessage(msg: ClaudeMessage): void {
    if (msg.subtype === 'init' && msg.session_id) {
      this.sessionId = msg.session_id;
      const span = this.tracer.startSpan('claude-code.init', {
        attributes: {
          ...this.baseAttributes(),
          'openinference.span.kind': 'CHAIN',
          'session.id': msg.session_id,
          'input.value': truncate(this.sessionContext.userText),
        },
      });
      span.end();
    } else if (msg.msg_type === 'result') {
      const attrs: Record<string, string | number | boolean> = {
        ...this.baseAttributes(),
        'openinference.span.kind': 'LLM',
        'component': 'model',
        'type': 'generation',
        'llm.model.name': 'claude',
        'llm.model.provider': 'anthropic',
        'input.value': truncate(this.lastOutput),
      };
      if (msg.result) {
        attrs['output.value'] = truncate(msg.result);
        attrs['llm.output_messages.0.message.role'] = 'assistant';
        attrs['llm.output_messages.0.message.content'] = truncate(msg.result);
        this.lastOutput = msg.result;
      }
      if (msg.duration_ms !== undefined) {
        attrs['llm.duration_ms'] = msg.duration_ms;
      }
      if (msg.duration_api_ms !== undefined) {
        attrs['llm.duration_api_ms'] = msg.duration_api_ms;
      }
      if (msg.is_error !== undefined) {
        attrs['llm.is_error'] = msg.is_error;
      }

      const span = this.tracer.startSpan('claude-code.result', { attributes: attrs });
      span.end();
    }
  }

  private handleAssistantMessage(msg: ClaudeMessage): void {
    const content = msg.content || msg.message?.content;
    if (!content) return;

    for (const item of content) {
      if (item.type === 'text' && item.text) {
        const output = item.text;
        const span = this.tracer.startSpan('llm.claude', {
          attributes: {
            ...this.baseAttributes(),
            'openinference.span.kind': 'LLM',
            'component': 'model',
            'type': 'generation',
            'llm.model.name': 'claude',
            'llm.model.provider': 'anthropic',
            'input.value': truncate(this.lastOutput),
            'output.value': truncate(output),
            'llm.output_messages.0.message.role': 'assistant',
            'llm.output_messages.0.message.content': truncate(output),
          },
        });
        span.end();
        this.lastOutput = output;
      } else if (item.type === 'tool_use') {
        const toolName = item.name || 'unknown';
        const toolInput = item.input ? JSON.stringify(item.input) : '';
        const toolId = item.id || '';

        // Store pending tool call - span will be created when we get the result
        if (toolId) {
          this.pendingToolCalls.set(toolId, {
            toolName,
            toolInput,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  private handleUserMessage(msg: ClaudeMessage): void {
    const content = msg.content || msg.message?.content;
    if (!content) return;

    for (const item of content) {
      if (item.type === 'tool_result') {
        const toolId = item.tool_use_id || '';

        // Extract tool output - can be string or array
        let toolOutput = '';
        if (typeof item.content === 'string') {
          toolOutput = item.content;
        } else if (Array.isArray(item.content) && item.content[0]?.text) {
          toolOutput = item.content[0].text;
        }

        // Find the pending tool call to get input and name
        const pending = this.pendingToolCalls.get(toolId);
        const toolName = pending?.toolName || 'unknown';
        const toolInput = pending?.toolInput || '';

        // Create a single span with both input and output
        const attrs: Record<string, string> = {
          ...this.baseAttributes(),
          'openinference.span.kind': 'TOOL',
          'component': 'tool',
          'type': 'tool',
          'name': toolName,
          'tool.name': toolName,
          'tool.input': truncate(toolInput),
          'tool.output': truncate(toolOutput),
          'input.value': truncate(toolInput),
          'output.value': truncate(toolOutput),
        };
        if (toolId) {
          attrs['tool.id'] = toolId;
        }

        const span = this.tracer.startSpan(`tool.${toolName}`, { attributes: attrs });
        span.end();

        // Clean up pending call
        if (toolId) {
          this.pendingToolCalls.delete(toolId);
        }

        this.lastOutput = toolOutput;
      }
    }
  }

  end(_error?: Error): void {
    // No-op - each message creates its own independent span
  }
}
