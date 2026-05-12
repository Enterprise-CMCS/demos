import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { PersonType, UpdateDeliverableInput } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  editDeliverable,
  EditDeliverableInput,
  getDeliverable,
  manuallyUpdateDeliverableDueDate,
  parseUpdateDeliverableInput,
  updateDeliverableDemonstrationTypes,
  validateUpdateDeliverableInput,
  validateUserPersonTypeAllowed,
} from ".";
import { prisma } from "../../prismaClient";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { getUser } from "../user/queries";

export async function updateDeliverable(
  deliverableId: string,
  input: UpdateDeliverableInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "updateDeliverable", ["demos-admin", "demos-cms-user"]);
  checkOptionalNotNullFields(["name", "cmsOwnerUserId", "dueDate", "demonstrationTypes"], input);
  const parsedInput = parseUpdateDeliverableInput(input);

  const updatedDeliverable = await prisma().$transaction(async (tx) => {
    await validateUpdateDeliverableInput(deliverableId, parsedInput, tx);

    // Directly edit name and CMS owner
    // Cast below enforced by database
    const editInput: EditDeliverableInput = {};
    if (parsedInput.name) {
      editInput.name = parsedInput.name;
    }
    if (parsedInput.cmsOwnerUserId) {
      const cmsOwner = await getUser({ id: parsedInput.cmsOwnerUserId }, tx);
      editInput.cmsOwner = {
        cmsOwnerUserId: cmsOwner.id,
        cmsOwnerPersonTypeId: cmsOwner.personTypeId as PersonType,
      };
    }
    if (Object.keys(editInput).length > 0) {
      await editDeliverable(deliverableId, editInput, tx);
    }

    // Update demonstration types and due date
    await updateDeliverableDemonstrationTypes(deliverableId, parsedInput, tx);
    await manuallyUpdateDeliverableDueDate(deliverableId, parsedInput, context, tx);

    return await getDeliverable({ id: deliverableId }, { tx: tx });
  });
  return updatedDeliverable;
}
