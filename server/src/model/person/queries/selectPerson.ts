import { Person as PrismaPerson, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectPerson(
  where: Prisma.PersonWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaPerson | null> {
  const prismaClient = tx ?? prisma();
  return prismaClient.person.findAtMostOne({ where });
}
