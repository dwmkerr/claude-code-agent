import { existsSync } from 'fs';
import { resolve } from 'path';

export interface Config {
  host: string;
  port: number;
  workspace: string;
  timeoutSeconds: number;
  logPath: string | null;
  agentName: string;
  claudeArgs: string[];  // Passthrough args for Claude Code (via --)
}

export interface CliOptions {
  port?: number;
  host?: string;
  workspace?: string;
  timeout?: number;
  logPath?: string;
  agentName?: string;
}

// Detect if running in a container (Docker/Helm)
function isContainer(): boolean {
  return existsSync('/.dockerenv') || existsSync('/run/.containerenv');
}

// Get workspace path with sensible defaults
function getWorkspace(cliWorkspace?: string): string {
  if (cliWorkspace) {
    return resolve(cliWorkspace);
  }
  if (process.env.CLAUDE_CODE_WORKSPACE_DIR) {
    return resolve(process.env.CLAUDE_CODE_WORKSPACE_DIR);
  }
  return isContainer() ? '/workspace' : resolve('./workspace');
}

export function loadConfig(cliOptions: CliOptions = {}, claudeArgs: string[] = []): Config {
  return {
    host: cliOptions.host || process.env.HOST || '0.0.0.0',
    port: cliOptions.port || parseInt(process.env.PORT || '2222', 10),
    workspace: getWorkspace(cliOptions.workspace),
    timeoutSeconds: cliOptions.timeout || parseInt(process.env.CLAUDE_TIMEOUT_SECONDS || '3600', 10),
    logPath: cliOptions.logPath || process.env.CLAUDE_LOG_PATH || null,
    agentName: cliOptions.agentName || process.env.CLAUDE_AGENT_NAME || 'claude-code',
    claudeArgs,
  };
}
