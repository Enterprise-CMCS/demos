import { PrismaTransactionClient } from "../../prismaClient";
import type { PersonType } from "../../types";
import { selectPerson } from "../person/queries";

export async function checkPersonIsStateUser(
  personId: string,
  tx: PrismaTransactionClient
): Promise<string | undefined> {
  const person = await selectPerson(
    { id: personId, personTypeId: "demos-state-user" satisfies PersonType },
    tx
  );
  if (!person) {
    return `Person ${personId} is not a state user.`;
  }
}
