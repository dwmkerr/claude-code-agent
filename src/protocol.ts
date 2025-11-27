// A2A Protocol Constants. Currently not exported from the SDK.

export const Kind = {
  Message: 'message',
  Task: 'task',
  StatusUpdate: 'status-update',
  Text: 'text',
  File: 'file',
  Data: 'data',
  Error: 'error',
} as const;

export type KindType = typeof Kind[keyof typeof Kind];

export const Role = {
  User: 'user',
  Agent: 'agent',
} as const;

export const TaskState = {
  Submitted: 'submitted',
  Working: 'working',
  InputRequired: 'input-required',
  Completed: 'completed',
  Canceled: 'canceled',
  Failed: 'failed',
  Rejected: 'rejected',
  AuthRequired: 'auth-required',
  Unknown: 'unknown',
} as const;
