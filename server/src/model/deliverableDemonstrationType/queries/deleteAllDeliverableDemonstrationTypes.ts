import { Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function deleteAllDeliverableDemonstrationTypes(
  where: Prisma.DeliverableDemonstrationTypeWhereInput,
  tx?: PrismaTransactionClient
): Promise<void> {
  const prismaClient = tx ?? prisma();
  await prismaClient.deliverableDemonstrationType.deleteMany({
    where: where,
  });
}
