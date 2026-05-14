import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { Role } from "../../../types";

// This type is present mostly to make testing easier
export type IsStatePointOfContactOnDeliverableDemonstrationResult = {
  id: string;
  demonstration: {
    id: string;
    demonstrationRoleAssignments: {
      personId: string;
    }[];
  };
};

export async function isStatePointOfContactOnDeliverableDemonstration(
  deliverableId: string,
  personId: string,
  tx?: PrismaTransactionClient
): Promise<boolean> {
  const prismaClient = tx ?? prisma();
  const result: IsStatePointOfContactOnDeliverableDemonstrationResult =
    await prismaClient.deliverable.findUniqueOrThrow({
      where: { id: deliverableId },
      select: {
        id: true,
        demonstration: {
          select: {
            id: true,
            demonstrationRoleAssignments: {
              where: {
                roleId: "State Point of Contact" satisfies Role,
                personId: personId,
              },
              select: {
                personId: true,
              },
            },
          },
        },
      },
    });
  if (result.demonstration.demonstrationRoleAssignments.length > 0) {
    return true;
  } else {
    return false;
  }
}
