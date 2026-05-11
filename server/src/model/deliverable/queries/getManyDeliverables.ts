import { Prisma, Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { DELETED_DELIVERABLE_STATUS } from "../../../constants";

export async function getManyDeliverables(
  filter: Prisma.DeliverableWhereInput = {},
  options: {
    includeDeleted?: boolean;
    tx?: PrismaTransactionClient;
  } = {}
): Promise<PrismaDeliverable[]> {
  const prismaClient = options.tx ?? prisma();
  let finalFilter = filter;
  if (!options.includeDeleted) {
    finalFilter = {
      ...filter,
      NOT: { statusId: DELETED_DELIVERABLE_STATUS },
    };
  }
  const deliverables = await prismaClient.deliverable.findMany({
    where: { ...finalFilter },
  });
  return deliverables;
}
