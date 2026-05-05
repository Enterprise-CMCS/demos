import { Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DemonstrationRoleAssignmentQueryResult } from ".";

export async function selectManyDemonstrationRoleAssignments(
  where: Prisma.DemonstrationRoleAssignmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<DemonstrationRoleAssignmentQueryResult[]> {
  const prismaClient = tx ?? prisma();
  const result = await prismaClient.demonstrationRoleAssignment.findMany({
    where,
    include: {
      primaryDemonstrationRoleAssignment: true,
    },
  });

  return result.map((demonstrationRoleAssignment) => {
    const { primaryDemonstrationRoleAssignment, ...rest } = demonstrationRoleAssignment;
    return {
      ...rest,
      isPrimary: !!primaryDemonstrationRoleAssignment,
    };
  });
}
