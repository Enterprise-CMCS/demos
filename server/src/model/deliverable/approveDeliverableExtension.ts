import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { ApproveDeliverableExtensionInput, DeliverableStatus } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  editDeliverable,
  getDeliverable,
  parseApproveDeliverableExtensionInput,
  validateApproveDeliverableExtensionInput,
  validateUserPersonTypeAllowed,
} from ".";
import { prisma } from "../../prismaClient";
import { insertDeliverableAction } from "../deliverableAction/queries";
import {
  selectDeliverableExtension,
  updateDeliverableExtension,
} from "../deliverableExtension/queries";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";

export async function approveDeliverableExtension(
  deliverableId: string,
  input: ApproveDeliverableExtensionInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "approveDeliverableExtension", [
    "demos-admin",
    "demos-cms-user",
  ]);
  checkOptionalNotNullFields(["newDueDate"], input);

  return await prisma().$transaction(async (tx) => {
    // Note that parsing is inside tx here because we need to get the extension first
    // This is passed to the parser to give back the final date to use
    const unapprovedDeliverable = await getDeliverable({ id: deliverableId }, tx);
    const unapprovedDeliverableExtension = await selectDeliverableExtension(
      { id: input.deliverableExtensionId },
      true,
      tx
    );
    const parsedInput = parseApproveDeliverableExtensionInput(
      input,
      unapprovedDeliverableExtension
    );

    // Pass request and current data into validation
    validateApproveDeliverableExtensionInput(
      unapprovedDeliverable,
      unapprovedDeliverableExtension,
      parsedInput
    );

    // All casts below enforced by database
    // Cannot go from Past Due to Past Due; otherwise, status does not change
    const newDeliverableStatus = (
      unapprovedDeliverable.statusId === "Past Due" ? "Upcoming" : unapprovedDeliverable.statusId
    ) as DeliverableStatus;

    // Make changes in order - update deliverable, insert action, close extension
    // This ensures that action record has the extension ID attached by triggers
    const approvedDeliverable = await editDeliverable(
      deliverableId,
      {
        statusId: newDeliverableStatus,
        dueDate: parsedInput.finalDateGranted.easternTZDate,
      },
      tx
    );
    await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Approved Extension Request",
        oldStatus: unapprovedDeliverable.statusId as DeliverableStatus,
        newStatus: approvedDeliverable.statusId as DeliverableStatus,
        oldDueDate: unapprovedDeliverable.dueDate,
        newDueDate: parsedInput.finalDateGranted.easternTZDate,
        userId: context.user.id,
      },
      tx
    );
    await updateDeliverableExtension(
      input.deliverableExtensionId,
      {
        statusId: "Approved",
        finalDateGranted: parsedInput.finalDateGranted.easternTZDate,
      },
      tx
    );
    return approvedDeliverable;
  });
}
