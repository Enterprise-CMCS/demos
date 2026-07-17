import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { SetDeliverableDemonstrationTypesInput } from "..";
import { selectDeliverableOrThrow } from "../../deliverable";

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
  return await selectDeliverableOrThrow({ id: input.deliverableId }, prismaClient);
}
