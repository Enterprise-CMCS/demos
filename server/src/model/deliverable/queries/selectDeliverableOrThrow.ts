import { Prisma, Deliverable as PrismaDeliverable } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { selectDeliverable } from "./selectDeliverable";

export async function selectDeliverableOrThrow(
  filter: Prisma.DeliverableWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable> {
  const deliverable = await selectDeliverable(filter, tx);
  if (!deliverable) {
    throw new Error("No deliverable found matching the provided filter");
  }
  return deliverable;
}
