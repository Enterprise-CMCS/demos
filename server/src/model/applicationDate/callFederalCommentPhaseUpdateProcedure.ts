import type { PrismaTransactionClient } from "../../prismaClient";
import { prisma } from "../../prismaClient";

export async function callFederalCommentPhaseUpdateProcedure(
  applicationId: string,
  tx?: PrismaTransactionClient
): Promise<void> {
  const prismaClient = tx ?? prisma();
  await prismaClient.$executeRaw`CALL demos_app.update_federal_comment_phase_status(${applicationId}::UUID);`;
}
