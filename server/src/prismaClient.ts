import { Prisma, PrismaClient } from "@prisma/client";
import prismaRandom from "prisma-extension-random";
import { log } from "./log";

export type PrismaTransactionClient = Parameters<
  Parameters<ReturnType<typeof prisma>["$transaction"]>[0]
>[0];

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
      log.warn({ durationMs: event.duration, target: event.target }, "prisma.slow_query");
    }
  });

  baseClient.$on("warn", (event: Prisma.LogEvent) => {
    log.warn({ message: event.message }, "prisma.warn");
  });

  baseClient.$on("error", (event: Prisma.LogEvent) => {
    if (
      // Can't directly filter P2025 because it's not in the message
      // This is the error message string for P2025 errors
      event.message.includes(
        "An operation failed because it depends on one or more records " +
          "that were required but not found."
      )
    ) {
      return;
    }
    log.error({ message: event.message }, "prisma.error");
  });

  // Extension to handle P2025 from redundant update suppression
  // P2025 happens when 0 rows are returned as changed from PostgreSQL
  // We try to run update/upsert statements and catch cases of P2025
  // If P2025 occurs, we try to fetch the record
  // If it exists, we know the P2025 is caused by suppressing redundant updates
  // Otherwise, it is genuine
  const clientWithRedundantUpdateHandler = baseClient.$extends({
    query: {
      $allModels: {
        async update({ args, query, model }) {
          try {
            return await query(args);
          } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
              // @ts-expect-error: Dynamic model access creates incompatible union of all model signatures
              // Runtime safe: Prisma extension guarantees model and args.where are correctly paired
              // Also note: model is PascalCase, baseClient attributes are camelCase, Prisma handles this internally
              const activeModel = baseClient[model];
              const existing = await activeModel.findUnique({
                where: args.where,
              });
              if (existing) {
                log.warn({ model, where: args.where }, "prisma.redundant_update_suppressed.update");
                return existing;
              } else {
                log.error({ message: error.message }, "prisma.error");
              }
            }
            throw error;
          }
        },
        async upsert({ args, query, model }) {
          try {
            return await query(args);
          } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
              // @ts-expect-error: Dynamic model access creates incompatible union of all model signatures
              const activeModel = baseClient[model];
              const existing = await activeModel.findUnique({
                where: args.where,
              });
              if (existing) {
                log.warn({ model, where: args.where }, "prisma.redundant_update_suppressed.upsert");
                return existing;
              } else {
                log.error({ message: error.message }, "prisma.error");
              }
            }
            throw error;
          }
        },
      },
    },
  });

  const client = clientWithRedundantUpdateHandler.$extends(prismaRandom());

  return client;
};

type PrismaExtendedClient = ReturnType<typeof createExtendedClient>;

let prismaClient: PrismaExtendedClient | undefined;

export const prisma = () => {
  prismaClient ??= createExtendedClient();

  return prismaClient;
};
