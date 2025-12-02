const passthrough = (s: string) => s;

jest.mock('chalk', () => ({
  __esModule: true,
  default: {
    blue: passthrough,
    green: passthrough,
    cyan: passthrough,
    yellow: passthrough,
    white: passthrough,
    dim: passthrough,
  },
}));

import { formatChunkPreview } from './format-chunk';

describe('formatChunkPreview', () => {
  const indent = 0;
  const termWidth = 80;

  test('system:init with session_id', () => {
    const msg = { type: 'system', subtype: 'init', session_id: 'a6d626b0-6e9b-4dab-819d-ac36e577a1b7' };
    expect(formatChunkPreview(msg, indent, termWidth)).toBe('system:init session=a6d626b0...');
  });

  test('system:result', () => {
    const msg = { type: 'system', msg_type: 'result', result: 'Task completed successfully' };
    expect(formatChunkPreview(msg, indent, termWidth)).toBe('system:result "Task completed successfully"');
  });

  test('assistant with text', () => {
    const msg = { type: 'assistant', content: [{ type: 'text', text: 'Here is what I found' }] };
    expect(formatChunkPreview(msg, indent, termWidth)).toBe('assistant: "Here is what I found"');
  });

  test('assistant with tool_use', () => {
    const msg = { type: 'assistant', content: [{ type: 'tool_use', name: 'Bash' }] };
    expect(formatChunkPreview(msg, indent, termWidth)).toBe('assistant: Bash ');
  });

  test('user with tool_result with content', () => {
    const msg = { type: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_017Jrx', content: 'File created successfully' }] };
    expect(formatChunkPreview(msg, indent, termWidth)).toBe('user: tool_result "File created successfully"');
  });

  test('user with tool_result without content', () => {
    const msg = { type: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_017Jrx' }] };
    expect(formatChunkPreview(msg, indent, termWidth)).toBe('user: tool_result (ok)');
  });

  test('truncates long text', () => {
    const longText = 'A'.repeat(100);
    const msg = { type: 'assistant', content: [{ type: 'text', text: longText }] };
    const result = formatChunkPreview(msg, indent, termWidth);
    // Text truncated to fit terminal width
    expect(result.length).toBeLessThanOrEqual(termWidth);
    expect(result).toContain('...');
  });
});
