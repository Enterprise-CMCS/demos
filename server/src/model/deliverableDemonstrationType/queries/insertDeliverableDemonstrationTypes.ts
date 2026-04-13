import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient.js";
import { SetDeliverableDemonstrationTypesInput } from "..";
import { getDeliverable } from "../../deliverable";

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
  return await getDeliverable({ id: input.deliverableId }, prismaClient);
}
