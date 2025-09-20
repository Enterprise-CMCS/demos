import { PrismaClient } from "@prisma/client";
import prismaRandom from "prisma-extension-random";
import { log } from "./logger.js";

// really annoying typescript hackiness to get the types to play well with the $extends method
// the prisma random extension will be eventually removed.
const createExtendedClient = () => {
  const client = new PrismaClient({
    log: [
      { level: "warn", emit: "event" },
      { level: "error", emit: "event" },
      { level: "query", emit: "event" },
    ],
  }).$extends(prismaRandom());

  // Log slow queries (>500ms) without params to avoid PII
  // @ts-ignore - event types are available at runtime
  (client as any).$on("query", (e: any) => {
    const duration = e?.duration as number | undefined;
    if (typeof duration === "number" && duration > 500) {
      log.warn("prisma.slow_query", { durationMs: duration, target: e?.target });
    }
  });
  // @ts-ignore
  (client as any).$on("warn", (e: any) => {
    log.warn("prisma.warn", { message: e?.message });
  });
  // @ts-ignore
  (client as any).$on("error", (e: any) => {
    log.error("prisma.error", { message: e?.message });
  });

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
