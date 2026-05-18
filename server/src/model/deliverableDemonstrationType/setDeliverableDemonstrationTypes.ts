import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { TagName } from "../../types";
import {
  deleteAllDeliverableDemonstrationTypes,
  insertDeliverableDemonstrationTypes,
} from "./queries";
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { selectDeliverable } from "../deliverable";

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
  const deliverable = await selectDeliverable({ id: input.deliverableId }, prismaClient);
  if (!deliverable) {
    throw new Error(`Deliverable with ID ${input.deliverableId} not found`);
  }
  return deliverable;
}
