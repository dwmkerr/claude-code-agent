#!/usr/bin/env node

// Force colors in non-TTY environments (e.g., container logs)
process.env.FORCE_COLOR = '1';

import dotenv from 'dotenv';
import express from 'express';
import chalk from 'chalk';
import { setupA2ARoutes } from './routes.js';
import pkg from '../package.json' with { type: 'json' };

// Load .env file if present
dotenv.config();

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
setupA2ARoutes(app, HOST, PORT);

app.listen(PORT, HOST, () => {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  const maskedKey = '*******' + apiKey.slice(-3);
  console.log(`${pkg.name} v${pkg.version}`);
  console.log(`Anthropic API Key: ${maskedKey}`);
  console.log(`running on: http://${HOST}:${PORT}`);
}).on('error', (err) => {
  console.error(chalk.red(`error: ${err.message}`));
  process.exit(1);
});
