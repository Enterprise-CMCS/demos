import { PRIMARY_DEMONSTRATION_ROLE_ASSIGNMENT_PERSON_TYPES } from "../../constants";
import { prisma } from "../../prismaClient";
import { SetDemonstrationRoleInput } from "./demonstrationRoleAssignmentSchema";

export const checkPersonCanBePrimary = async (
  input: SetDemonstrationRoleInput
): Promise<string | undefined> => {
  const person = await prisma().person.findUnique({
    where: { id: input.personId },
  });

  if (!person) {
    throw new Error(`Person with ID ${input.personId} not found.`);
  }

  if (
    input.isPrimary &&
    !PRIMARY_DEMONSTRATION_ROLE_ASSIGNMENT_PERSON_TYPES.includes(person.personTypeId)
  ) {
    return `A user of type ${person} is not permitted to be assigned as the primary role for a demonstration.`;
  }
};
