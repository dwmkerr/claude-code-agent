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
  // Default terminal width is 80 when process.stdout.columns is undefined

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

  test('user with tool_result with content', () => {
    const msg = { type: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_017Jrx', content: 'File created successfully' }] };
    expect(formatChunkPreview(msg)).toBe('user: tool_result "File created successfully"');
  });

  test('user with tool_result without content', () => {
    const msg = { type: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_017Jrx' }] };
    expect(formatChunkPreview(msg)).toBe('user: tool_result (ok)');
  });

  test('truncates long text', () => {
    const longText = 'A'.repeat(100);
    const msg = { type: 'assistant', content: [{ type: 'text', text: longText }] };
    const result = formatChunkPreview(msg);
    // Text truncated to 60 chars max
    expect(result).toMatch(/^assistant: "A{57}\.\.\."/);
  });
});
