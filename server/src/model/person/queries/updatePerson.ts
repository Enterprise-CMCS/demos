import { Prisma, Person as PrismaPerson } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function updatePerson(
  where: Prisma.PersonWhereUniqueInput,
  updateData: Prisma.PersonUncheckedUpdateInput,
  tx?: PrismaTransactionClient
): Promise<PrismaPerson> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.person.update({ where: where, data: updateData });
}
