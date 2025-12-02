#!/usr/bin/env node

// Force colors in non-TTY environments (e.g., container logs)
process.env.FORCE_COLOR = '1';

import { mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

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
import dotenv from 'dotenv';
import express from 'express';
import chalk from 'chalk';
import { setupA2ARoutes } from './routes.js';
import { loadConfig } from './config.js';
import { loadSkills } from './skill-loader.js';
import pkg from '../package.json' with { type: 'json' };

// Load .env file if present
const dotenvResult = dotenv.config();
const loadedEnvVars = dotenvResult.parsed ? Object.keys(dotenvResult.parsed) : [];

// Load configuration
const config = loadConfig();

// Create workspace directory if it doesn't exist
try {
  mkdirSync(config.workspace, { recursive: true });
} catch (err: any) {
  console.error(chalk.red(`error: failed to create workspace directory: ${err.message}`));
  process.exit(1);
}

const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '2222', 10);

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
setupA2ARoutes(app, HOST, PORT, config, skills);

const server = app.listen(PORT, HOST, () => {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  const maskedKey = '*******' + apiKey.slice(-3);
  console.log(`${pkg.name} v${pkg.version}`);
  console.log(`Anthropic API Key: ${maskedKey}`);
  if (loadedEnvVars.length > 0) {
    console.log('Loaded from .env:');
    loadedEnvVars.forEach(v => console.log(`  ${v}`));
  }
  console.log(`Workspace: ${config.workspace}`);
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
  if (config.logPath) {
    console.log(`Logging chunks to: ${config.logPath}`);
  }
  console.log(`Running on: http://${HOST}:${PORT}`);
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
