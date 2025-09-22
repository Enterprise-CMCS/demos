import { AsyncLocalStorage } from 'node:async_hooks';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown> | undefined;

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

// Default local to debug
const stage = process.env.STAGE || process.env.NODE_ENV || 'dev';
const defaultLevel: LogLevel = stage === 'development' || stage === 'dev' ? 'debug' : 'info';
const envLevel = (process.env.LOG_LEVEL || defaultLevel).toLowerCase() as LogLevel;
const currentLevel: LogLevel = (['debug', 'info', 'warn', 'error'] as LogLevel[]).includes(envLevel)
  ? envLevel
  : defaultLevel;

const base = {
  service: process.env.SERVICE_NAME || 'demos-server',
  stage: process.env.STAGE || process.env.NODE_ENV || 'dev',
};

type Ctx = {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  operationName?: string;
};

const storage = new AsyncLocalStorage<Ctx>();

function write(level: LogLevel, msg: string, meta?: LogMeta) {
  if (levelOrder[level] < levelOrder[currentLevel]) return;
  const ctx = storage.getStore() || {};
  // Avoid nesting too deep; keep top-level concise
  const line = {
    level,
    msg,
    time: new Date().toISOString(),
    ...base,
    ...ctx,
    ...(meta || {}),
  };
  // Ensure it is a single line JSON for CloudWatch Insights
  try {
    console.log(JSON.stringify(line));
  } catch {
    console.log(JSON.stringify({ level, msg, time: new Date().toISOString(), ...base }));
  }
}

export const log = {
  debug: (msg: string, meta?: LogMeta) => write('debug', msg, meta),
  info: (msg: string, meta?: LogMeta) => write('info', msg, meta),
  warn: (msg: string, meta?: LogMeta) => write('warn', msg, meta),
  error: (msg: string, meta?: LogMeta) => write('error', msg, meta),
};

export function setRequestContext(ctx: Ctx) {
  // Enter or update the async context for the current execution
  const current = storage.getStore();
  if (current) {
    Object.assign(current, ctx);
  } else {
    storage.enterWith({ ...ctx });
  }
}

export function addToRequestContext(fields: Partial<Ctx>) {
  const current = storage.getStore();
  if (current) Object.assign(current, fields);
  else storage.enterWith({ ...(fields as Ctx) });
}

export function getRequestContext(): Ctx {
  return storage.getStore() || {};
}

