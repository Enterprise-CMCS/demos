import {createLambdaLogger} from "demos-shared-library/log"
import pino from "pino";


const isNotOnAWS = () => !process.env.AWS_EXECUTION_ENV;
const REDACTED = "[REDACTED]";
const serializeError = (value: unknown) =>
  value instanceof Error ? pino.stdSerializers.err(value) : value;
const serializeLogObject = (value: object) =>
  Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, serializeError(entryValue)])
  );
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


export const {log, reqIdChild, store, als } = createLambdaLogger("uipath", {
  formatters: {
    log: (obj) => {
      // Extract top-level fields (eg. type to match default AWS lambda logs)
      // All other fields go under `ctx`
      const { type, ...rest } = obj;
      // check `rest` length to prevent logging ctx:{}
      return {
        type,
        ctx: Object.keys(rest).length ? serializeLogObject(rest) : undefined,
      };
    },
  },
  redact: {
    paths: LOGGER_REDACTION_PATHS,
    censor: REDACTED,
  },
  serializers: {
    err: serializeError,
    error: serializeError,
  },
  transport: isNotOnAWS() ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          singleLine: false,
          messageFormat: "{msg}", // only prints msg (still prints ctx separately)
        },
      }
    : undefined,
})
