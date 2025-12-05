import { User as PrismaUser } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";

export async function findUserById(
  tx: PrismaTransactionClient,
  userId: string
): Promise<PrismaUser> {
  return await tx.user.findUniqueOrThrow({
    where: { id: userId },
  });
}
