#!/usr/bin/env node

// Force colors in non-TTY environments (e.g., container logs)
process.env.FORCE_COLOR = '1';

import { mkdirSync, cpSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import express from 'express';
import chalk from 'chalk';
import { setupA2ARoutes } from './routes.js';
import { loadConfig } from './config.js';
import { loadSkills } from './skill-loader.js';
import pkg from '../package.json' with { type: 'json' };

// Parse --additional-skills-dir CLI argument
function getAdditionalSkillsDir(): string | undefined {
  const arg = process.argv.find(a => a.startsWith('--additional-skills-dir='));
  if (arg) return arg.split('=')[1];
  return process.env.ADDITIONAL_SKILLS_DIR;
}

// Copy skills from source directory to workspace/.claude/skills/
function copySkills(sourceDir: string, targetDir: string): string[] {
  const copied: string[] = [];
  if (!existsSync(sourceDir)) return copied;

  mkdirSync(targetDir, { recursive: true });
  const entries = readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const src = join(sourceDir, entry.name);
    const dest = join(targetDir, entry.name);
    cpSync(src, dest, { recursive: true });
    copied.push(`${sourceDir}/${entry.name}`);
  }
  return copied;
}

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

// Copy additional skills to workspace if configured
const additionalSkillsDir = getAdditionalSkillsDir();
const workspaceSkillsDir = join(config.workspace, '.claude', 'skills');
const copiedSkillPaths: string[] = [];

if (additionalSkillsDir) {
  const copied = copySkills(additionalSkillsDir, workspaceSkillsDir);
  copiedSkillPaths.push(...copied);
}

// Load skills from workspace/.claude/skills
const skills = loadSkills(workspaceSkillsDir, copiedSkillPaths);

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
  if (additionalSkillsDir) {
    console.log(`Additional skills: ${additionalSkillsDir}`);
  }
  if (skills.length > 0) {
    console.log('Loaded skills:');
    skills.forEach(s => {
      const source = s.sourcePath ? ` (${s.sourcePath})` : '';
      console.log(`  ${s.name}${source}`);
    });
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
