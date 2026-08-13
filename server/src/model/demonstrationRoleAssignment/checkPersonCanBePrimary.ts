import { PRIMARY_DEMONSTRATION_ROLE_ASSIGNMENT_PERSON_TYPES } from "../../constants";
import { PrismaTransactionClient } from "../../prismaClient";
import { SetDemonstrationRoleInput } from "./demonstrationRoleAssignmentSchema";

export const checkPersonCanBePrimary = async (
  input: SetDemonstrationRoleInput,
  tx: PrismaTransactionClient
): Promise<string | undefined> => {
  const person = await tx.person.findUnique({
    where: { id: input.personId },
  });

  if (!person) {
    throw new Error(`Person with ID ${input.personId} not found.`);
  }

  if (
    input.isPrimary &&
    !(PRIMARY_DEMONSTRATION_ROLE_ASSIGNMENT_PERSON_TYPES as readonly string[]).includes(
      person.personTypeId
    )
  ) {
    return `A user of type ${person.personTypeId} is not permitted to be assigned as the primary role for a demonstration.`;
  }
};
