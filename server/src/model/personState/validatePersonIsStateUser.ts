import { PrismaTransactionClient } from "../../prismaClient";
import { PersonType } from "../../types";
import { selectPersonOrThrow } from "../person/queries";

export async function validatePersonIsStateUser(
  personId: string,
  tx: PrismaTransactionClient
): Promise<string | undefined> {
  const person = await selectPersonOrThrow({ id: personId }, tx);
  if (person.personTypeId !== ("demos-state-user" satisfies PersonType)) {
    return `Person ${personId} is not a state user.`;
  }
}
