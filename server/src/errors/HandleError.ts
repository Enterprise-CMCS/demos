import { Prisma } from "@prisma/client";

export function handleError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2003":
        throw new Error(
          "Foreign key constraint failed, please validate your input parameters. Constraint violated: " +
            error.meta!.constraint
        );
    }
  } else {
    throw error;
  }
}
