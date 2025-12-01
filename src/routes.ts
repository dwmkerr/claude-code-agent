import { type Express } from 'express';
import {
  InMemoryTaskStore,
  DefaultRequestHandler,
} from '@a2a-js/sdk/server';
import { A2AExpressApp } from '@a2a-js/sdk/server/express';
import { createAgent } from './claude-code-agent.js';
import { Config } from './config.js';
import { Skill } from './skill-loader.js';

export function setupA2ARoutes(app: Express, host: string, port: number, config: Config, skills: Skill[] = []): void {
  // Use env vars for agent card URL if provided, otherwise use actual host/port
  const cardHost = process.env.AGENT_CARD_HOST || host;
  const cardPort = process.env.AGENT_CARD_PORT || port.toString();

  // Create agent with config and skills
  const agent = createAgent(config, skills);

  // Patch the agent card URL with configured host/port
  const agentCardWithUrl = {
    ...agent.card,
    url: `http://${cardHost}:${cardPort}/`,
  };

  // Create task store and request handler
  const taskStore = new InMemoryTaskStore();
  const requestHandler = new DefaultRequestHandler(
    agentCardWithUrl,
    taskStore,
    agent.executor
  );

  // Create A2A Express app and setup routes on main app
  const a2aApp = new A2AExpressApp(requestHandler);

  // Simple request logging middleware
  const loggingMiddleware = (req: any, _res: any, next: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  };

  a2aApp.setupRoutes(app, '', [loggingMiddleware]);
}
