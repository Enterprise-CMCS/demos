import { Prisma, Person as PrismaPerson } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { selectPerson } from "./selectPerson";

export async function selectPersonOrThrow(
  filter: Prisma.PersonWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaPerson> {
  const person = await selectPerson(filter, tx);
  if (!person) {
    throw new Error("No person found matching the provided filter");
  }
  return person;
}
