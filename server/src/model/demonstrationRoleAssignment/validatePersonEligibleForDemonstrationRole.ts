import { throwCustomGQLError } from "../../errors/errorCodes";
import { prisma, PrismaTransactionClient } from "../../prismaClient";

export const validatePersonEligibleForDemonstrationRole = async (
  personId: string,
  roleId: string,
  tx?: PrismaTransactionClient
) => {
  const prismaClient = tx ?? prisma();
  const person = await prismaClient.person.findUniqueOrThrow({
    where: { id: personId },
    select: { id: true, personTypeId: true },
  });

  const eligibleRole = await prismaClient.rolePersonType.findMany({
    where: { personTypeId: person.personTypeId, roleId },
    select: { roleId: true },
  });

  if (eligibleRole.length !== 1) {
    throwCustomGQLError(
      `Person with ID ${person.id} of type ${person.personTypeId} is not eligible for role with ID ${roleId}.`,
      "DEMONSTRATION_ROLE_ASSIGNMENT_ERROR"
    );
  }
};
