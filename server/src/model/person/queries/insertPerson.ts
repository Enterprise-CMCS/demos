import { Person, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function insertPerson(
  input: Prisma.PersonUncheckedCreateInput,
  tx?: PrismaTransactionClient
): Promise<Person> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.person.create({ data: input });
}
