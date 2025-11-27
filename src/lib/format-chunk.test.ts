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
  test('system:init with session_id', () => {
    const msg = { type: 'system', subtype: 'init', session_id: 'a6d626b0-6e9b-4dab-819d-ac36e577a1b7' };
    expect(formatChunkPreview(msg)).toBe('system:init session=a6d626b0...');
  });

  test('system:result', () => {
    const msg = { type: 'system', msg_type: 'result', result: 'Task completed successfully' };
    expect(formatChunkPreview(msg)).toBe('system:result "Task completed successfully"');
  });

  test('assistant with text', () => {
    const msg = { type: 'assistant', content: [{ type: 'text', text: 'Here is what I found' }] };
    expect(formatChunkPreview(msg)).toBe('assistant: "Here is what I found"');
  });

  test('assistant with tool_use', () => {
    const msg = { type: 'assistant', content: [{ type: 'tool_use', name: 'Bash' }] };
    expect(formatChunkPreview(msg)).toBe('assistant: tool_use Bash');
  });

  test('user with tool_result', () => {
    const msg = { type: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_017JrxGvXGLfC7fcMkUfZXSL' }] };
    expect(formatChunkPreview(msg)).toBe('user: tool_result toolu_017Jrx...');
  });

  test('truncates long text', () => {
    const longText = 'A'.repeat(100);
    const msg = { type: 'assistant', content: [{ type: 'text', text: longText }] };
    expect(formatChunkPreview(msg)).toBe(`assistant: "${'A'.repeat(50)}..."`);
  });
});
