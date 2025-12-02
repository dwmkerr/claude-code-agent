import chalk from 'chalk';

// External indent added by caller ("      < " = 8 chars)
const EXTERNAL_INDENT = 8;

// Get terminal width
function getTermWidth(): number {
  return process.stdout.columns || 80;
}

// Truncate text to fit remaining width after prefix
function truncateToFit(text: string, prefixLen: number): string {
  const available = Math.max(getTermWidth() - EXTERNAL_INDENT - prefixLen - 3, 20);
  if (text.length <= available) return text;
  return text.substring(0, available) + '...';
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
      const prefix = 'system:result ';
      const result = truncateToFit((msg.result || '').replace(/\s+/g, ' '), prefix.length + 2);
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
    const prefix = `${type}: `;
    const text = truncateToFit(first.text.replace(/\s+/g, ' '), prefix.length + 2);
    // Assistant text messages in white for visibility, others dim
    const textColor = type === 'assistant' ? chalk.white : chalk.dim;
    return `${typeColor(type)}: ${textColor(`"${text}"`)}`;
  }
  if (first.type === 'tool_use') {
    const toolName = first.name || 'unknown';
    const prefix = `${type}: ${toolName} `;
    const params = first.input ? truncateToFit(JSON.stringify(first.input), prefix.length) : '';
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
      const prefix = `${type}: tool_result `;
      return `${typeColor(type)}: ${chalk.yellow('tool_result')} ${chalk.dim(`"${truncateToFit(preview, prefix.length + 2)}"`)}`;
    }
    return `${typeColor(type)}: ${chalk.yellow('tool_result')} ${chalk.dim('(ok)')}`;
  }

  return `${typeColor(type)}: ${chalk.dim(first.type)}`;
}
