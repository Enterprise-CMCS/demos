import { Person as PrismaPerson, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyPeople(
  where: Prisma.PersonWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaPerson[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.person.findMany({ where });
}
