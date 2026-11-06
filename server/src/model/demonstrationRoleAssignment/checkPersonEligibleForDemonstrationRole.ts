import { prisma, PrismaTransactionClient } from "../../prismaClient";

export const checkPersonEligibleForDemonstrationRole = async (
  personId: string,
  roleId: string,
  tx?: PrismaTransactionClient
): Promise<string | undefined> => {
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
    return `Person with id ${person.id} of type ${person.personTypeId} is not eligible for the ${roleId} demonstration role.`;
  }
};
