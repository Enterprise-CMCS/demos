import pino from "pino";
import { AsyncLocalStorage } from "node:async_hooks";

const isNotOnAWS = () => !process.env.AWS_EXECUTION_ENV;
const REDACTED = "[REDACTED]";
const LOGGER_REDACTION_PATHS = [
  "authorization",
  "Authorization",
  "headers.authorization",
  "headers.Authorization",
  "clientSecret",
  "client_secret",
  "access_token",
  "refresh_token",
  "id_token",
  "password",
  "secret",
];
LOGGER_REDACTION_PATHS.push(...LOGGER_REDACTION_PATHS.map((path) => `ctx.${path}`));
const REDACTED_LOG_OBJECTS = ["error", "err", "ctx.error", "ctx.err"];
const REDACTED_ERROR_PATHS = [
  "config.headers.authorization",
  "config.headers.Authorization",
  "request.headers.authorization",
  "request.headers.Authorization",
  "response.config.headers.authorization",
  "response.config.headers.Authorization",
  "response.data.clientSecret",
  "response.data.client_secret",
  "response.data.access_token",
  "response.data.refresh_token",
  "response.data.id_token",
  "response.data.token",
  "response.data.password",
  "response.data.secret",
];

for (const logObject of REDACTED_LOG_OBJECTS) {
  LOGGER_REDACTION_PATHS.push(...REDACTED_ERROR_PATHS.map((path) => `${logObject}.${path}`));
}

export const setupLogger = (serviceName: string, destination?: pino.DestinationStream) =>
  pino({
    level: process.env.LOG_LEVEL ?? "info",
    redact: {
      paths: LOGGER_REDACTION_PATHS,
      censor: REDACTED,
    },
    // match lambda application logs, which use "timestamp" rather than "time"
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    base: {
      svc: serviceName,
    },
    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      },
      log: (obj) => {
        // Extract top-level fields (eg. type to match default AWS lambda logs)
        // All other fields go under `ctx`
        const { type, ...rest } = obj;
        // check `rest` length to prevent logging ctx:{}
        return { type, ctx: Object.keys(rest).length && rest || undefined };
      },
    },
    // Disable pretty transport in bundled/worker contexts to avoid worker path issues.
    transport: isNotOnAWS()
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          singleLine: false,
          messageFormat: "{msg}", // only prints msg (still prints ctx separately)
        },
      }
    : undefined,
  }, destination);

export const parentLogger = setupLogger("uipath");

export const reqIdChild = (id: string, extra?: object) => {
  const child = parentLogger.child({requestId: id, ...extra });
  als.getStore()?.set("logger", child);
  return child;
};

export const store = new Map();
export const als = new AsyncLocalStorage<typeof store>();

export const log = new Proxy(parentLogger, {
  get(target, property, receiver) {
    target = als.getStore()?.get("logger") ?? target;
    return Reflect.get(target, property, receiver);
  },
});
