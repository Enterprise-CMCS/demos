import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { SetDeliverableDemonstrationTypesInput } from "../../types";
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { deleteAllDeliverableDemonstrationTypes, insertDeliverableDemonstrationTypes } from ".";
import { getDeliverable } from "../deliverable/queries/getDeliverable";

export async function setDeliverableDemonstrationTypes(
  input: SetDeliverableDemonstrationTypesInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDeliverable> {
  const prismaClient = tx ?? prisma();
  await deleteAllDeliverableDemonstrationTypes(
    { deliverableId: input.deliverableId },
    prismaClient
  );
  await insertDeliverableDemonstrationTypes(input, prismaClient);
  return getDeliverable({ id: input.deliverableId }, prismaClient);
}
