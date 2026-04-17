import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { TagName } from "../../types";
import { deleteAllDeliverableDemonstrationTypes, insertDeliverableDemonstrationTypes } from ".";
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { getDeliverable } from "../deliverable";

export type SetDeliverableDemonstrationTypesInput = {
  deliverableId: string;
  demonstrationId: string;
  demonstrationTypes: TagName[];
};

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
