import { existsSync } from 'fs';
import { resolve } from 'path';

export interface Config {
  workspace: string;
  allowedTools: string;
  permissionMode: string;
  timeoutSeconds: number;
  logPath: string | null;  // File path for full chunk logs (opt-in via CLAUDE_LOG_PATH)
  agentName: string;       // Agent name for A2A registration
}

// Detect if running in a container (Docker/Helm)
function isContainer(): boolean {
  return existsSync('/.dockerenv') || existsSync('/run/.containerenv');
}

// Get workspace path with sensible defaults
function getWorkspace(): string {
  if (process.env.CLAUDE_CODE_WORKSPACE_DIR) {
    return resolve(process.env.CLAUDE_CODE_WORKSPACE_DIR);
  }
  return isContainer() ? '/workspace' : resolve('./workspace');
}

export function loadConfig(): Config {
  return {
    workspace: getWorkspace(),
    allowedTools: process.env.CLAUDE_ALLOWED_TOOLS || 'Bash,Read,Edit,Write,Grep,Glob,Skill',
    permissionMode: process.env.CLAUDE_PERMISSION_MODE || 'acceptEdits',
    timeoutSeconds: parseInt(process.env.CLAUDE_TIMEOUT_SECONDS || '3600', 10),
    logPath: process.env.CLAUDE_LOG_PATH || null,
    agentName: process.env.CLAUDE_AGENT_NAME || 'claude-code',
  };
}
