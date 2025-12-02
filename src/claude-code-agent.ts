import type { AgentCard } from '@a2a-js/sdk';
import { ClaudeCodeExecutor } from './claude-code-executor.js';
import { Config } from './config.js';
import { Skill } from './skill-loader.js';
import pkg from '../package.json' with { type: 'json' };

const AgentId = 'claude-code-agent';

function createAgentCard(skills: Skill[]): AgentCard {
  return {
    name: 'Claude Code Agent',
    description: 'Claude Code AI assistant for software engineering tasks',
    url: '', // Will be set dynamically
    provider: {
      organization: 'Ark Demo',
      url: 'https://github.com/dwmkerr/ark-demo-claude',
    },
    version: pkg.version,
    protocolVersion: '1.0',
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    securitySchemes: undefined,
    security: undefined,
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      tags: skill.tags,
      examples: skill.examples,
      inputModes: skill.inputModes,
      outputModes: skill.outputModes,
    })),
    supportsAuthenticatedExtendedCard: false,
  };
}

export interface A2AAgent {
  id: string;
  card: AgentCard;
  executor: ClaudeCodeExecutor;
}

export function createAgent(config: Config, skills: Skill[] = []): A2AAgent {
  return {
    id: AgentId,
    card: createAgentCard(skills),
    executor: new ClaudeCodeExecutor(config),
  };
}
