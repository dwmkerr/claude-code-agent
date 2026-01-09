import { loadConfig, loadConfigFile, CliOptions } from './config';
import { writeFileSync, unlinkSync } from 'fs';

describe('loadConfigFile', () => {
  const testConfigPath = './test-config.yaml';

  afterEach(() => {
    try {
      unlinkSync(testConfigPath);
    } catch {
      // File may not exist
    }
  });

  it('should return null when no config file exists', () => {
    const result = loadConfigFile('./nonexistent.yaml');
    expect(result).toBeNull();
  });

  it('should load config from YAML file', () => {
    writeFileSync(testConfigPath, `
server:
  host: "127.0.0.1"
  port: 3000
agent:
  name: "test-agent"
  workspace: "/test/workspace"
  timeout: 7200
logging:
  path: "/var/log/claude.log"
claudeArgs:
  - "--mcp-config"
  - "/config/mcp.json"
`);

    const result = loadConfigFile(testConfigPath);

    expect(result).not.toBeNull();
    expect(result?.server?.host).toBe('127.0.0.1');
    expect(result?.server?.port).toBe(3000);
    expect(result?.agent?.name).toBe('test-agent');
    expect(result?.agent?.workspace).toBe('/test/workspace');
    expect(result?.agent?.timeout).toBe(7200);
    expect(result?.logging?.path).toBe('/var/log/claude.log');
    expect(result?.claudeArgs).toEqual(['--mcp-config', '/config/mcp.json']);
  });

  it('should skip invalid YAML files', () => {
    writeFileSync(testConfigPath, 'invalid: yaml: content: [');
    const result = loadConfigFile(testConfigPath);
    expect(result).toBeNull();
  });
});

describe('loadConfig', () => {
  const testConfigPath = './test-load-config.yaml';
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env vars
    delete process.env.HOST;
    delete process.env.PORT;
    delete process.env.CLAUDE_CODE_WORKSPACE_DIR;
    delete process.env.CLAUDE_TIMEOUT_SECONDS;
    delete process.env.CLAUDE_LOG_PATH;
    delete process.env.CLAUDE_AGENT_NAME;
    delete process.env.CLAUDE_CODE_AGENT_CONFIG;
  });

  afterEach(() => {
    // Restore env vars
    process.env = { ...originalEnv };
    try {
      unlinkSync(testConfigPath);
    } catch {
      // File may not exist
    }
  });

  it('should return defaults when no config source exists', () => {
    const config = loadConfig();

    expect(config.host).toBe('0.0.0.0');
    expect(config.port).toBe(2222);
    expect(config.timeoutSeconds).toBe(3600);
    expect(config.logPath).toBeNull();
    expect(config.agentName).toBe('claude-code');
    expect(config.claudeArgs).toEqual([]);
  });

  it('should load config from file', () => {
    writeFileSync(testConfigPath, `
server:
  host: "10.0.0.1"
  port: 4000
agent:
  name: "file-agent"
`);

    const config = loadConfig({ config: testConfigPath });

    expect(config.host).toBe('10.0.0.1');
    expect(config.port).toBe(4000);
    expect(config.agentName).toBe('file-agent');
  });

  it('should override file config with env vars', () => {
    writeFileSync(testConfigPath, `
server:
  host: "10.0.0.1"
  port: 4000
agent:
  name: "file-agent"
`);

    process.env.HOST = '192.168.1.1';
    process.env.PORT = '5000';
    process.env.CLAUDE_AGENT_NAME = 'env-agent';

    const config = loadConfig({ config: testConfigPath });

    expect(config.host).toBe('192.168.1.1');
    expect(config.port).toBe(5000);
    expect(config.agentName).toBe('env-agent');
  });

  it('should override env vars with CLI options', () => {
    writeFileSync(testConfigPath, `
server:
  host: "10.0.0.1"
  port: 4000
`);

    process.env.HOST = '192.168.1.1';
    process.env.PORT = '5000';

    const cliOptions: CliOptions = {
      host: '127.0.0.1',
      port: 8080,
      config: testConfigPath,
    };

    const config = loadConfig(cliOptions);

    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(8080);
  });

  it('should merge claudeArgs from file and CLI', () => {
    writeFileSync(testConfigPath, `
claudeArgs:
  - "--mcp-config"
  - "/config/mcp.json"
`);

    const config = loadConfig({ config: testConfigPath }, ['--allowedTools', 'Bash']);

    expect(config.claudeArgs).toEqual([
      '--mcp-config',
      '/config/mcp.json',
      '--allowedTools',
      'Bash',
    ]);
  });

  it('should load config from CLAUDE_CODE_AGENT_CONFIG env var', () => {
    writeFileSync(testConfigPath, `
server:
  port: 9999
`);

    process.env.CLAUDE_CODE_AGENT_CONFIG = testConfigPath;

    const config = loadConfig();

    expect(config.port).toBe(9999);
  });
});
