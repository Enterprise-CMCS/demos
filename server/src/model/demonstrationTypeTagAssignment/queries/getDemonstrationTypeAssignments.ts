import {
  Prisma,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
} from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function getDemonstrationTypeAssignments(
  filter: Prisma.DemonstrationTypeTagAssignmentWhereInput = {},
  tx?: PrismaTransactionClient
): Promise<PrismaDemonstrationTypeTagAssignment[]> {
  const prismaClient = tx ?? prisma();
  const demonstrationTypes = await prismaClient.demonstrationTypeTagAssignment.findMany({
    where: { ...filter },
  });
  return demonstrationTypes;
}
