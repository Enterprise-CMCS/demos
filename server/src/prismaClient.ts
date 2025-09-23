import { Prisma, PrismaClient } from "@prisma/client";
import prismaRandom from "prisma-extension-random";
import { log } from "./logger.js";

// really annoying typescript hackiness to get the types to play well with the $extends method
// the prisma random extension will be eventually removed.
const createExtendedClient = () => {
  const baseClient = new PrismaClient({
    log: [
      { level: "warn", emit: "event" },
      { level: "error", emit: "event" },
      { level: "query", emit: "event" },
    ],
  });

  baseClient.$on("query", (event: Prisma.QueryEvent) => {
    if (event.duration > 500) {
      log.warn("prisma.slow_query", { durationMs: event.duration, target: event.target });
    }
  });

  baseClient.$on("warn", (event: Prisma.LogEvent) => {
    log.warn("prisma.warn", { message: event.message });
  });

  baseClient.$on("error", (event: Prisma.LogEvent) => {
    log.error("prisma.error", { message: event.message });
  });

  const client = baseClient.$extends(prismaRandom());

  return client;
};
type PrismaExtendedClient = ReturnType<typeof createExtendedClient>;

let prismaClient: PrismaExtendedClient | undefined;

export const prisma = () => {
  if (!prismaClient) {
    prismaClient = createExtendedClient();
  }
  return prismaClient;
};
