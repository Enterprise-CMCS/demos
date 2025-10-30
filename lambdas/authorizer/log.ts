import pino from "pino";

export const setupLogger = (serviceName: string) =>
  pino({
    level: process.env.LOG_LEVEL ?? "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      svc: serviceName,
    },
    formatters: {
      level(label) {
        return { level: label };
      },
      log: (obj) => {
        // Extract top-level fields (eg. type to match default AWS lambda logs)
        // All other fields go under `ctx`
        const {type, ...rest} = obj
        return {type, ctx: rest}
      }
    },
  });

export const addReqId = (logger: pino.Logger, id: string) => {
  return logger.child({ reqId: id });
};
