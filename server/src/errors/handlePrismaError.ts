import { Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2003":
        throw new GraphQLError(
          `A foreign key constraint ${error.meta!.constraint} was violated in your input.`,
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

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    if (error.message.includes("violates check constraint")) {
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
