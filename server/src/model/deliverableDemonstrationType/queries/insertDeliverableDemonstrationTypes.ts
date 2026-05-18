import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { SetDeliverableDemonstrationTypesInput } from "..";
import { selectDeliverable } from "../../deliverable";

export async function insertDeliverableDemonstrationTypes(
  input: SetDeliverableDemonstrationTypesInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable> {
  const prismaClient = tx ?? prisma();
  if (input.demonstrationTypes.length > 0) {
    const createManyPayload = input.demonstrationTypes.map((demonstrationType) => ({
      deliverableId: input.deliverableId,
      demonstrationId: input.demonstrationId,
      demonstrationTypeTagNameId: demonstrationType,
    }));
    await prismaClient.deliverableDemonstrationType.createMany({
      data: createManyPayload,
    });
  }
  const deliverable = await selectDeliverable({ id: input.deliverableId }, prismaClient);
  if (!deliverable) {
    throw new Error(`Deliverable with ID ${input.deliverableId} not found`);
  }
  return deliverable;
}
