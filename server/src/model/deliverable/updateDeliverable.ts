import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { UpdateDeliverableInput } from "../../types";
import { GraphQLContext } from "../../auth/auth.util";
import {
  editDeliverable,
  EditDeliverableInput,
  getDeliverable,
  manuallyUpdateDeliverableDueDate,
  parseUpdateDeliverableInput,
  updateDeliverableDemonstrationTypes,
  validateUpdateDeliverableInput,
} from ".";
import { prisma } from "../../prismaClient";

export async function updateDeliverable(
  deliverableId: string,
  input: UpdateDeliverableInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  const parsedInput = parseUpdateDeliverableInput(input);

  const updatedDeliverable = await prisma().$transaction(async (tx) => {
    await validateUpdateDeliverableInput(deliverableId, parsedInput, tx);

    // Directly edit name, deliverable type, and CMS owner
    const editInput: EditDeliverableInput = {};
    if (input.name) editInput.name = input.name;
    if (input.deliverableType) editInput.deliverableTypeId = input.deliverableType;
    if (input.cmsOwnerUserId) editInput.cmsOwnerUserId = input.cmsOwnerUserId;
    if (Object.keys(editInput).length > 0) {
      editDeliverable(deliverableId, editInput, tx);
    }

    // Update demonstration types and due date
    updateDeliverableDemonstrationTypes(deliverableId, parsedInput, tx);
    manuallyUpdateDeliverableDueDate(deliverableId, parsedInput, context, tx);

    return await getDeliverable({ id: deliverableId }, tx);
  });
  return updatedDeliverable;
}
