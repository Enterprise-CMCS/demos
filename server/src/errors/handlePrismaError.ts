import { GraphQLError } from "graphql";

function isKnownRequestError(error: unknown): error is {
  code: string;
  message: string;
  meta?: { constraint?: string };
} {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  return typeof candidate.code === "string" && typeof candidate.message === "string";
}

function isUnknownRequestError(error: unknown): error is { message: string } {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { message?: unknown };
  return typeof candidate.message === "string";
}

export function handlePrismaError(error: unknown): never {
  if (isKnownRequestError(error)) {
    switch (error.code) {
      case "P2003":
        throw new GraphQLError(
          `A foreign key constraint ${error.meta?.constraint ?? "unknown"} was violated in your input.`,
          {
            extensions: {
              code: "VIOLATED_FOREIGN_KEY",
              originalMessage: error.message,
            },
          }
        );
      case "P2025":
        throw new GraphQLError("An operation was attempted on a record that does not exist.", {
          extensions: {
            code: "NO_RECORD_FOUND_FOR_OPERATION",
            originalMessage: error.message,
          },
        });
      default:
        throw new GraphQLError("A known Prisma error was encountered with no custom handling.", {
          extensions: {
            code: "KNOWN_PRISMA_ERROR",
            originalMessage: error.message,
          },
        });
    }
  }

  if (isUnknownRequestError(error)) {
    if (error.message.includes("violates check constraint")) {
      // Regex extracts the name of the check constraint from the message string
      const constraintMatch = /violates check constraint \\"([^"]+)\\"/.exec(error.message);
      const constraintName = constraintMatch ? constraintMatch[1] : "unknown";
      throw new GraphQLError(`A check constraint was violated in your input: ${constraintName}.`, {
        extensions: {
          code: "VIOLATED_CHECK_CONSTRAINT",
          constraintName: constraintName,
          originalMessage: error.message,
        },
      });
    }
  }

  throw error;
}
