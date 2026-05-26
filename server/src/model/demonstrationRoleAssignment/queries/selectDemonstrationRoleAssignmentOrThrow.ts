import { Prisma } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { selectDemonstrationRoleAssignment } from "./selectDemonstrationRoleAssignment";
import { DemonstrationRoleAssignmentQueryResult } from ".";

export async function selectDemonstrationRoleAssignmentOrThrow(
  filter: Prisma.DemonstrationRoleAssignmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<DemonstrationRoleAssignmentQueryResult> {
  const demonstrationRoleAssignment = await selectDemonstrationRoleAssignment(filter, tx);
  if (!demonstrationRoleAssignment) {
    throw new Error("No demonstrationRoleAssignment found matching the provided filter");
  }
  return demonstrationRoleAssignment;
}
