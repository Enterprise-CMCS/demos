import { Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DemonstrationRoleAssignmentQueryResult } from ".";

export async function selectDemonstrationRoleAssignment(
  where: Prisma.DemonstrationRoleAssignmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<DemonstrationRoleAssignmentQueryResult | null> {
  const prismaClient = tx ?? prisma();
  const result = await prismaClient.demonstrationRoleAssignment.findAtMostOne({
    where,
    include: {
      primaryDemonstrationRoleAssignment: true,
    },
  });

  if (!result) {
    return null;
  }
  const { primaryDemonstrationRoleAssignment, ...rest } = result;
  return {
    ...rest,
    isPrimary: !!primaryDemonstrationRoleAssignment,
  };
}
