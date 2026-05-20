import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectLastLoginForUser(
  userId: string,
  tx?: PrismaTransactionClient
): Promise<Date | null> {
  const prismaClient = tx ?? prisma();
  const result = await prismaClient.userSession.aggregate({
    _max: {
      authTime: true,
    },
    where: {
      userId: userId,
    },
  });
  return result._max.authTime;
}
