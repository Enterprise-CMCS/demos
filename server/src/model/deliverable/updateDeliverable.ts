import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { PersonType, UpdateDeliverableInput } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  editDeliverable,
  EditDeliverableInput,
  selectDeliverableOrThrow,
  manuallyUpdateDeliverableDueDate,
  parseUpdateDeliverableInput,
  updateDeliverableDemonstrationTypes,
  validateUpdateDeliverableInput,
  validateUserPersonTypeAllowed,
} from ".";
import { prisma } from "../../prismaClient";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { selectUserOrThrow } from "../user/queries";
import { dispatchDeliverableDueDateUpdatedEmail } from "../email";

type UpdateDeliverableOptions = {
  sendEmailNotifications?: boolean;
};

export async function updateDeliverable(
  deliverableId: string,
  input: UpdateDeliverableInput,
  context: GraphQLContext,
  options: UpdateDeliverableOptions = {}
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "updateDeliverable", ["demos-admin", "demos-cms-user"]);
  checkOptionalNotNullFields(["name", "cmsOwnerUserId", "dueDate", "demonstrationTypes"], input);
  const parsedInput = parseUpdateDeliverableInput(input);

  const { deliverable, dueDateUpdate } = await prisma().$transaction(async (tx) => {
    await validateUpdateDeliverableInput(deliverableId, parsedInput, tx);

    // Directly edit name and CMS owner
    // Cast below enforced by database
    const editInput: EditDeliverableInput = {};
    if (parsedInput.name) {
      editInput.name = parsedInput.name;
    }
    if (parsedInput.cmsOwnerUserId) {
      const cmsOwner = await selectUserOrThrow({ id: parsedInput.cmsOwnerUserId }, tx);
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
    const dueDateUpdate = await manuallyUpdateDeliverableDueDate(
      deliverableId,
      parsedInput,
      context,
      tx
    );

    return {
      deliverable: await selectDeliverableOrThrow({ id: deliverableId }, tx),
      dueDateUpdate,
    };
  });

  if (dueDateUpdate && options.sendEmailNotifications !== false) {
    await dispatchDeliverableDueDateUpdatedEmail({
      deliverableId,
      previousDueDate: dueDateUpdate.previousDueDate,
      sourceActionId: dueDateUpdate.sourceActionId,
      triggeredByUserId: context.user.id,
    });
  }

  return deliverable;
}
