import { UserSession as PrismaUserSession } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { UserType } from "../../../types";

export async function upsertUserSession(
  userId: string,
  personTypeId: UserType,
  authTime: Date,
  tx?: PrismaTransactionClient
): Promise<PrismaUserSession> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.userSession.upsert({
    where: {
      userId_authTime: {
        userId: userId,
        authTime: authTime,
      },
    },
    create: {
      userId: userId,
      personTypeId: personTypeId,
      authTime: authTime,
      lastAuthEventTime: authTime,
      authEventCount: 1,
    },
    update: {
      lastAuthEventTime: new Date(),
      authEventCount: {
        increment: 1,
      },
    },
  });
}
