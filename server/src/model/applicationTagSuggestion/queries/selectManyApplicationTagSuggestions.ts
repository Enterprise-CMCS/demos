import { Prisma, ApplicationTagSuggestion as PrismaApplicationTagSuggestion } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyApplicationTagSuggestions(
  where: Prisma.ApplicationTagSuggestionWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationTagSuggestion[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.applicationTagSuggestion.findMany({
    where,
  });
}
