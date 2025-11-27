import chalk from 'chalk';

// Format a Claude CLI JSON chunk for console output (max 80 chars)
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
      const result = (msg.result || '').substring(0, 50).replace(/\s+/g, ' ');
      return `${typeColor('system')}:${chalk.yellow('result')} ${chalk.dim(`"${result}${(msg.result?.length || 0) > 50 ? '...' : ''}"`)}`;
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
    const text = first.text.substring(0, 50).replace(/\s+/g, ' ');
    return `${typeColor(type)}: ${chalk.dim(`"${text}${first.text.length > 50 ? '...' : ''}"`)}`;
  }
  if (first.type === 'tool_use') {
    return `${typeColor(type)}: ${chalk.yellow('tool_use')} ${chalk.dim(first.name || 'unknown')}`;
  }
  if (first.type === 'tool_result') {
    // Extract preview from content (string or array)
    let preview = '';
    if (typeof first.content === 'string') {
      preview = first.content.substring(0, 40).replace(/\s+/g, ' ');
    } else if (Array.isArray(first.content) && first.content[0]?.text) {
      preview = first.content[0].text.substring(0, 40).replace(/\s+/g, ' ');
    }
    if (preview) {
      return `${typeColor(type)}: ${chalk.yellow('tool_result')} ${chalk.dim(`"${preview}..."`)}`;
    }
    return `${typeColor(type)}: ${chalk.yellow('tool_result')} ${chalk.dim('(ok)')}`;
  }

  return `${typeColor(type)}: ${chalk.dim(first.type)}`;
}
