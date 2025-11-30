#!/usr/bin/env node

// Force colors in non-TTY environments (e.g., container logs)
process.env.FORCE_COLOR = '1';

import { mkdirSync } from 'fs';
import dotenv from 'dotenv';
import express from 'express';
import chalk from 'chalk';
import { setupA2ARoutes } from './routes.js';
import { loadConfig } from './config.js';
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

const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Setup A2A routes
setupA2ARoutes(app, HOST, PORT, config);

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
