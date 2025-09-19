import { Prisma } from "@prisma/client";

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2003":
        throw new Error(
          "Foreign key constraint failed, please validate your input parameters. Constraint violated: " +
            error.meta!.constraint
        );
      default:
        throw new Error("A Prisma error was encountered: " + error);
    }
  } else {
    throw error;
  }
}
