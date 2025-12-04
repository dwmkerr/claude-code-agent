#!/usr/bin/env node

// Force colors in non-TTY environments (e.g., container logs)
process.env.FORCE_COLOR = '1';

import { mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Command } from 'commander';
import dotenv from 'dotenv';
import express from 'express';
import chalk from 'chalk';
import { setupA2ARoutes } from './routes.js';
import { loadConfig, CliOptions } from './config.js';
import { loadSkills } from './skill-loader.js';
import pkg from '../package.json' with { type: 'json' };

// Count lines in a file, returns null if file doesn't exist
function countLines(filePath: string): number | null {
  if (!existsSync(filePath)) return null;
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return null;
  }
}

// Parse CLI arguments
const program = new Command();
program
  .name('claude-code-agent')
  .description('A2A agent server that wraps Claude Code. Use -- to pass args to Claude.')
  .version(pkg.version)
  .option('-p, --port <number>', 'server port', parseInt)
  .option('-H, --host <string>', 'server host')
  .option('-w, --workspace <path>', 'workspace directory')
  .option('--timeout <seconds>', 'execution timeout in seconds', parseInt)
  .option('--log-path <path>', 'path to write Claude output logs')
  .option('--agent-name <name>', 'agent name for A2A registration')
  .allowUnknownOption()
  .parse(process.argv);

const opts = program.opts();

// Everything after -- is passed through to Claude Code
const claudeArgs = program.args;

// Map CLI options to config
const cliOptions: CliOptions = {
  port: opts.port,
  host: opts.host,
  workspace: opts.workspace,
  timeout: opts.timeout,
  logPath: opts.logPath,
  agentName: opts.agentName,
};

// Load .env file if present
const dotenvResult = dotenv.config();
const loadedEnvVars = dotenvResult.parsed ? Object.keys(dotenvResult.parsed) : [];

// Load configuration (CLI options override env vars)
const config = loadConfig(cliOptions, claudeArgs);

// Create workspace directory if it doesn't exist
try {
  mkdirSync(config.workspace, { recursive: true });
} catch (err: any) {
  console.error(chalk.red(`error: failed to create workspace directory: ${err.message}`));
  process.exit(1);
}

// Check for required ANTHROPIC_API_KEY
if (!process.env.ANTHROPIC_API_KEY) {
  console.error(chalk.red('error: ANTHROPIC_API_KEY environment variable is required'));
  process.exit(1);
}

// Load Claude config from both locations:
// - User: ~/.claude/ (global, mount here for container use)
// - Project: workspace/.claude/ (repo-specific)
const userClaudeDir = join(process.env.HOME || '/home/ark', '.claude');
const projectClaudeDir = join(config.workspace, '.claude');

// Check for CLAUDE.md files
const userClaudeMd = join(userClaudeDir, 'CLAUDE.md');
const projectClaudeMd = join(projectClaudeDir, 'CLAUDE.md');
const userClaudeMdLines = countLines(userClaudeMd);
const projectClaudeMdLines = countLines(projectClaudeMd);

// Load skills
const userSkillsDir = join(userClaudeDir, 'skills');
const projectSkillsDir = join(projectClaudeDir, 'skills');
const userSkills = loadSkills(userSkillsDir, 'user');
const projectSkills = loadSkills(projectSkillsDir, 'project');
const skills = [...userSkills, ...projectSkills];

const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Setup A2A routes with loaded skills
setupA2ARoutes(app, config.host, config.port, config, skills);

const server = app.listen(config.port, config.host, () => {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  const maskedKey = '*******' + apiKey.slice(-3);
  console.log(`${pkg.name} v${pkg.version}`);
  console.log(`Anthropic API Key: ${maskedKey}`);
  if (loadedEnvVars.length > 0) {
    console.log('Loaded from .env:');
    loadedEnvVars.forEach(v => console.log(`  ${v}`));
  }
  console.log(`Workspace: ${config.workspace}`);
  if (config.logPath) {
    console.log(`Log: ${config.logPath}`);
  }
  if (config.claudeArgs.length > 0) {
    console.log(`Claude args: ${config.claudeArgs.join(' ')}`);
  }
  if (userClaudeMdLines !== null) {
    console.log(`  ~/CLAUDE.md: ${userClaudeMdLines} lines`);
  }
  if (projectClaudeMdLines !== null) {
    console.log(`  .claude/CLAUDE.md: ${projectClaudeMdLines} lines`);
  }
  if (userSkills.length > 0) {
    console.log('User skills:');
    userSkills.forEach(s => console.log(`  ${s.name}`));
  }
  if (projectSkills.length > 0) {
    console.log('Project skills:');
    projectSkills.forEach(s => console.log(`  ${s.name}`));
  }
  console.log(`Running on: http://${config.host}:${config.port}`);
}).on('error', (err) => {
  console.error(chalk.red(`error: ${err.message}`));
  process.exit(1);
});

// Graceful shutdown on SIGINT/SIGTERM
const shutdown = () => {
  console.log('\nShutting down...');
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
