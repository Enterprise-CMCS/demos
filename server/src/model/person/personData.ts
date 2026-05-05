import { Prisma, Person as PrismaPerson } from "@prisma/client";
import { selectPerson, selectManyPeople } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

export async function getPerson(
  where: Prisma.PersonWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaPerson | null> {
  return await selectPerson(where, tx);
}

export async function getManyPeople(
  where: Prisma.PersonWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaPerson[]> {
  return await selectManyPeople(where, tx);
}
