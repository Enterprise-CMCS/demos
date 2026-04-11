import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { log } from "./log";

function isKnownRequestError(error: unknown): error is { code: string; message: string } {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  return typeof candidate.code === "string" && typeof candidate.message === "string";
}

export type PrismaTransactionClient = Parameters<
  Parameters<ReturnType<typeof prisma>["$transaction"]>[0]
>[0];

// really annoying typescript hackiness to get the types to play well with the $extends method
// the prisma random extension will be eventually removed.
const createExtendedClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set to initialize Prisma client");
  }

  let schema: string | undefined;
  try {
    const url = new URL(connectionString);
    schema = url.searchParams.get("schema") ?? undefined;
  } catch {
    // Ignore URL parsing errors and let adapter fallback to driver defaults.
  }

  const adapter = new PrismaPg(
    {
      connectionString,
      ssl: { rejectUnauthorized: false },
    },
    {
      schema,
    }
  );

  const baseClient = new PrismaClient({
    adapter,
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

  const clientWithFindAtMostOne = baseClient.$extends({
    model: {
      $allModels: {
        async findAtMostOne<T, A extends Prisma.Args<T, "findMany">>(
          this: T,
          args: Prisma.Exact<A, Prisma.Args<T, "findMany">>
        ): Promise<Prisma.Result<T, A, "findMany">[number] | null> {
          const context = Prisma.getExtensionContext(this);

          if (!("findMany" in context) || typeof context.findMany !== "function") {
            throw new Error("findAtMostOne can only be used on models that support findMany");
          }

          const result = await context.findMany(args);
          if (result.length < 1) {
            return null;
          }
          if (result.length > 1) {
            throw new Error(`Expected at most one record, but found ${result.length}`);
          }
          return result[0];
        },
      },
    },
  });

  // Extension to handle P2025 from redundant update suppression
  // P2025 happens when 0 rows are returned as changed from PostgreSQL
  // We try to run update/upsert statements and catch cases of P2025
  // If P2025 occurs, we try to fetch the record
  // If it exists, we know the P2025 is caused by suppressing redundant updates
  // Otherwise, it is genuine
  const clientWithRedundantUpdateHandler = clientWithFindAtMostOne.$extends({
    query: {
      $allModels: {
        async update({ args, query, model }) {
          try {
            return await query(args);
          } catch (error: unknown) {
            if (isKnownRequestError(error) && error.code === "P2025") {
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
            if (isKnownRequestError(error) && error.code === "P2025") {
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

  return clientWithRedundantUpdateHandler;
};

type PrismaExtendedClient = ReturnType<typeof createExtendedClient>;

let prismaClient: PrismaExtendedClient | undefined;

export const prisma = () => {
  prismaClient ??= createExtendedClient();

  return prismaClient;
};
