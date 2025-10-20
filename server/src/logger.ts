import { AsyncLocalStorage } from "node:async_hooks";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown> | undefined;

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

// Default local to debug
const stage = process.env.STAGE || process.env.NODE_ENV || "dev";
const isDevStage = stage === "development" || stage === "dev";
const defaultLevel: LogLevel = isDevStage ? "debug" : "info";
const envLevel = (process.env.LOG_LEVEL || defaultLevel).toLowerCase() as LogLevel;
const currentLevel: LogLevel = (["debug", "info", "warn", "error"] as LogLevel[]).includes(envLevel)
  ? envLevel
  : defaultLevel;

const base = {
  service: process.env.SERVICE_NAME || "demos-server",
  stage,
};

const logPrettyPref = process.env.LOG_PRETTY?.toLowerCase();
const shouldPrettyPrint = logPrettyPref
  ? logPrettyPref === "true"
  : isDevStage && typeof process.stdout !== "undefined" && Boolean(process.stdout.isTTY);

const levelColors: Record<LogLevel, string> = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const colorReset = "\x1b[0m";

function formatValue(value: unknown): string {
  if (value === undefined) return "";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Error) return value.message;
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  if (typeof value === "function") return "[function]";
  if (typeof value === "symbol") return value.toString();
  return "[unknown]";
}

function prettyPrint(line: Record<string, unknown>): void {
  const { level, msg, time, ...rest } = line;
  const levelLabel = String(level).toUpperCase().padEnd(5, " ");
  const color = typeof level === "string" ? levelColors[level as LogLevel] : "";
  const levelChunk = color ? `${color}${levelLabel}${colorReset}` : levelLabel;
  const timestamp =
    typeof time === "string" ? time.replace("T", " ").replace("Z", "") : new Date().toISOString();

  const metaEntries = Object.entries(rest).filter(([, value]) => value !== undefined);
  const metaText = metaEntries
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(" ")
    .trim();

  if (metaText.length > 0) {
    console.log(`${levelChunk} | ${String(msg)} | ${metaText} | ${timestamp}`);
  } else {
    console.log(`${levelChunk} | ${String(msg)} | ${timestamp}`);
  }
}

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
  // If local, pretty print for readability
  if (shouldPrettyPrint) {
    try {
      prettyPrint(line);
      return;
    } catch {
      // fall through to JSON logging if pretty printer fails
    }
  }
  // Ensure it is a single line JSON for CloudWatch Insights
  try {

    console.log(JSON.stringify(line));
  } catch {

    console.log(JSON.stringify({ level, msg, time: new Date().toISOString(), ...base }));
  }
}

export const log = {
  debug: (msg: string, meta?: LogMeta) => write("debug", msg, meta),
  info: (msg: string, meta?: LogMeta) => write("info", msg, meta),
  warn: (msg: string, meta?: LogMeta) => write("warn", msg, meta),
  error: (msg: string, meta?: LogMeta) => write("error", msg, meta),
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
