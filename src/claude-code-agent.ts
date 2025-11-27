import type { AgentCard } from '@a2a-js/sdk';
import { ClaudeCodeExecutor } from './claude-code-executor.js';
import pkg from '../package.json' with { type: 'json' };

const AgentId = 'claude-code-agent';

const agentCard: AgentCard = {
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
  skills: [
    {
      id: 'ark_analysis',
      name: 'Ark Analysis',
      description: 'Analyze the Ark codebase by cloning the repository to a temporary location',
      tags: ['ark', 'codebase', 'analysis'],
      examples: [
        'Analyze how the query controller works in Ark',
        'Explain the A2A server implementation in Ark',
        'Find all CRD definitions in the Ark codebase',
      ],
      inputModes: ['text/plain'],
      outputModes: ['text/plain'],
    },
  ],
  supportsAuthenticatedExtendedCard: false,
};

export interface A2AAgent {
  id: string;
  card: AgentCard;
  executor: ClaudeCodeExecutor;
}

export const claudeCodeAgent: A2AAgent = {
  id: AgentId,
  card: agentCard,
  executor: new ClaudeCodeExecutor(),
};
