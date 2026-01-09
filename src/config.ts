import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { parse as parseYaml } from 'yaml';

// YAML config file structure
export interface ConfigFile {
  server?: {
    host?: string;
    port?: number;
  };
  agent?: {
    name?: string;
    workspace?: string;
    timeout?: number;
  };
  logging?: {
    path?: string | null;
  };
  claudeArgs?: string[];
}

// Runtime config (resolved from all sources)
export interface Config {
  host: string;
  port: number;
  workspace: string;
  timeoutSeconds: number;
  logPath: string | null;
  agentName: string;
  claudeArgs: string[];
}

export interface CliOptions {
  port?: number;
  host?: string;
  workspace?: string;
  timeout?: number;
  logPath?: string;
  agentName?: string;
  config?: string;
}

// Detect if running in a container (Docker/Helm)
function isContainer(): boolean {
  return existsSync('/.dockerenv') || existsSync('/run/.containerenv');
}

// Get workspace path with sensible defaults
function getWorkspace(cliWorkspace?: string, fileWorkspace?: string): string {
  if (cliWorkspace) {
    return resolve(cliWorkspace);
  }
  if (process.env.CLAUDE_CODE_WORKSPACE_DIR) {
    return resolve(process.env.CLAUDE_CODE_WORKSPACE_DIR);
  }
  if (fileWorkspace) {
    return resolve(fileWorkspace);
  }
  return isContainer() ? '/workspace' : resolve('./workspace');
}

// Find and load config file
// Priority: CLI --config > CLAUDE_CODE_AGENT_CONFIG env > ./.claude-code-agent.yaml
export function loadConfigFile(configPath?: string): ConfigFile | null {
  const paths = [
    configPath,
    process.env.CLAUDE_CODE_AGENT_CONFIG,
    './.claude-code-agent.yaml',
  ].filter(Boolean) as string[];

  for (const p of paths) {
    const resolved = resolve(p);
    if (existsSync(resolved)) {
      try {
        const content = readFileSync(resolved, 'utf-8');
        return parseYaml(content) as ConfigFile;
      } catch {
        // Skip invalid files
        continue;
      }
    }
  }
  return null;
}

export function loadConfig(cliOptions: CliOptions = {}, claudeArgs: string[] = []): Config {
  // Load config file if available
  const fileConfig = loadConfigFile(cliOptions.config);

  return {
    // Server config: CLI > env > file > default
    host: cliOptions.host
      || process.env.HOST
      || fileConfig?.server?.host
      || '0.0.0.0',
    port: cliOptions.port
      || parseInt(process.env.PORT || '', 10)
      || fileConfig?.server?.port
      || 2222,

    // Agent config: CLI > env > file > default
    workspace: getWorkspace(cliOptions.workspace, fileConfig?.agent?.workspace),
    timeoutSeconds: cliOptions.timeout
      || parseInt(process.env.CLAUDE_TIMEOUT_SECONDS || '', 10)
      || fileConfig?.agent?.timeout
      || 3600,
    logPath: cliOptions.logPath
      || process.env.CLAUDE_LOG_PATH
      || fileConfig?.logging?.path
      || null,
    agentName: cliOptions.agentName
      || process.env.CLAUDE_AGENT_NAME
      || fileConfig?.agent?.name
      || 'claude-code',

    // Claude args: config file args first, then CLI args appended
    claudeArgs: [...(fileConfig?.claudeArgs || []), ...claudeArgs],
  };
}
