import { loadConfig } from './config';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('uses CLAUDE_CODE_WORKSPACE_DIR env var when set', () => {
    process.env.CLAUDE_CODE_WORKSPACE_DIR = '/custom/path';
    const config = loadConfig();
    expect(config.workspace).toBe('/custom/path');
  });

  test('defaults workspace to ./workspace when not in container', () => {
    delete process.env.CLAUDE_CODE_WORKSPACE_DIR;
    const config = loadConfig();
    expect(config.workspace).toMatch(/workspace$/);
  });

  test('uses CLAUDE_TIMEOUT_SECONDS when set', () => {
    process.env.CLAUDE_TIMEOUT_SECONDS = '600';
    const config = loadConfig();
    expect(config.timeoutSeconds).toBe(600);
  });

  test('defaults timeoutSeconds to 3600', () => {
    delete process.env.CLAUDE_TIMEOUT_SECONDS;
    const config = loadConfig();
    expect(config.timeoutSeconds).toBe(3600);
  });

  test('uses CLAUDE_LOG_PATH when set', () => {
    process.env.CLAUDE_LOG_PATH = '/var/log/claude.log';
    const config = loadConfig();
    expect(config.logPath).toBe('/var/log/claude.log');
  });

  test('defaults logPath to null', () => {
    delete process.env.CLAUDE_LOG_PATH;
    const config = loadConfig();
    expect(config.logPath).toBeNull();
  });

  test('passes through claudeArgs', () => {
    const config = loadConfig({}, ['--mcp-config', '/config/claude.json']);
    expect(config.claudeArgs).toEqual(['--mcp-config', '/config/claude.json']);
  });

  test('CLI options override env vars', () => {
    process.env.PORT = '3000';
    const config = loadConfig({ port: 4000 });
    expect(config.port).toBe(4000);
  });
});
