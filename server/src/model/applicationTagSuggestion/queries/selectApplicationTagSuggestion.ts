import { ApplicationTagSuggestion as PrismaApplicationTagSuggestion, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectApplicationTagSuggestion(
  where: Prisma.ApplicationTagSuggestionWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationTagSuggestion | null> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.applicationTagSuggestion.findAtMostOne({
    where,
  });
}
