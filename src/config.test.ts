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

  test('uses CLAUDE_ALLOWED_TOOLS when set', () => {
    process.env.CLAUDE_ALLOWED_TOOLS = 'Bash,Read';
    const config = loadConfig();
    expect(config.allowedTools).toBe('Bash,Read');
  });

  test('defaults allowedTools', () => {
    delete process.env.CLAUDE_ALLOWED_TOOLS;
    const config = loadConfig();
    expect(config.allowedTools).toBe('Bash,Read,Edit,Write,Grep,Glob');
  });

  test('uses CLAUDE_PERMISSION_MODE when set', () => {
    process.env.CLAUDE_PERMISSION_MODE = 'strict';
    const config = loadConfig();
    expect(config.permissionMode).toBe('strict');
  });

  test('defaults permissionMode to acceptEdits', () => {
    delete process.env.CLAUDE_PERMISSION_MODE;
    const config = loadConfig();
    expect(config.permissionMode).toBe('acceptEdits');
  });

  test('uses CLAUDE_TIMEOUT_SECONDS when set', () => {
    process.env.CLAUDE_TIMEOUT_SECONDS = '600';
    const config = loadConfig();
    expect(config.timeoutSeconds).toBe(600);
  });

  test('defaults timeoutSeconds to 300', () => {
    delete process.env.CLAUDE_TIMEOUT_SECONDS;
    const config = loadConfig();
    expect(config.timeoutSeconds).toBe(300);
  });
});
