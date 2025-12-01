import chalk from 'chalk';

// Truncate text to max length with ellipsis
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

// Format a Claude CLI JSON chunk for console output
export function formatChunkPreview(msg: any): string {
  const type = msg.type || 'unknown';

  // Type colors
  const typeColor = type === 'system' ? chalk.blue
    : type === 'assistant' ? chalk.green
    : type === 'user' ? chalk.cyan
    : chalk.white;

  if (type === 'system') {
    const subtype = msg.subtype || msg.msg_type || '';
    if (subtype === 'init' && msg.session_id) {
      return `${typeColor('system')}:${chalk.yellow('init')} ${chalk.dim(`session=${msg.session_id.substring(0, 8)}...`)}`;
    }
    if (subtype === 'result' || msg.msg_type === 'result') {
      const result = truncate((msg.result || '').replace(/\s+/g, ' '), 60);
      return `${typeColor('system')}:${chalk.yellow('result')} ${chalk.dim(`"${result}"`)}`;
    }
    return `${typeColor('system')}:${chalk.yellow(subtype)}`;
  }

  const content = msg.content || msg.message?.content;
  if (!content || !Array.isArray(content)) {
    return `${typeColor(type)}: ${chalk.dim('(no content)')}`;
  }

  const first = content[0];
  if (!first) return `${typeColor(type)}: ${chalk.dim('(empty)')}`;

  if (first.type === 'text' && first.text) {
    const text = truncate(first.text.replace(/\s+/g, ' '), 60);
    return `${typeColor(type)}: ${chalk.dim(`"${text}"`)}`;
  }
  if (first.type === 'tool_use') {
    const toolName = first.name || 'unknown';
    const params = first.input ? truncate(JSON.stringify(first.input), 60) : '';
    return `${typeColor(type)}: ${chalk.blue(toolName)} ${chalk.dim(params)}`;
  }
  if (first.type === 'tool_result') {
    let preview = '';
    if (typeof first.content === 'string') {
      preview = first.content.replace(/\s+/g, ' ');
    } else if (Array.isArray(first.content) && first.content[0]?.text) {
      preview = first.content[0].text.replace(/\s+/g, ' ');
    }
    if (preview) {
      return `${typeColor(type)}: ${chalk.yellow('tool_result')} ${chalk.dim(`"${truncate(preview, 50)}"`)}`;
    }
    return `${typeColor(type)}: ${chalk.yellow('tool_result')} ${chalk.dim('(ok)')}`;
  }

  return `${typeColor(type)}: ${chalk.dim(first.type)}`;
}
