import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { TagName } from "../../types";
import {
  deleteAllDeliverableDemonstrationTypes,
  insertDeliverableDemonstrationTypes,
} from "./queries";
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { selectDeliverableOrThrow } from "../deliverable";

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
  return await selectDeliverableOrThrow({ id: input.deliverableId }, prismaClient);
}
