import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { ApproveDeliverableExtensionInput, DeliverableStatus } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  editDeliverable,
  getDeliverable,
  parseApproveDeliverableExtensionInput,
  validateUserPersonTypeAllowed,
} from ".";
import { prisma } from "../../prismaClient";
import { insertDeliverableAction } from "../deliverableAction/queries";
import {
  selectDeliverableExtension,
  updateDeliverableExtension,
} from "../deliverableExtension/queries";
import { parseJSDateToEasternTZDate } from "../../dateUtilities";

export async function approveDeliverableExtension(
  deliverableId: string,
  input: ApproveDeliverableExtensionInput,
  context: GraphQLContext
): Promise<PrismaDeliverable> {
  validateUserPersonTypeAllowed(context, "approveDeliverableExtension", [
    "demos-admin",
    "demos-cms-user",
  ]);
  const parsedInput = parseApproveDeliverableExtensionInput(input);

  return await prisma().$transaction(async (tx) => {
    const unapprovedDeliverable = await getDeliverable({ id: deliverableId }, tx);
    const deliverableExtension = await selectDeliverableExtension(input.deliverableExtensionId, tx);
    const finalDateGranted =
      parsedInput.newDueDate ??
      parseJSDateToEasternTZDate(deliverableExtension.originalDateRequested);
    const approvedDeliverable = await editDeliverable(deliverableId, {
      statusId:
        unapprovedDeliverable.statusId === "Past Due"
          ? "Upcoming"
          : (unapprovedDeliverable.statusId as DeliverableStatus),
      dueDate: finalDateGranted.easternTZDate,
    });

    // await validateRequestDeliverableExtensionInput(deliverable, parsedInput, tx);

    // Casts below enforced by database
    // Insert the action before closing the deliverable
    // This ensures that the ID is recorded correctly by the triggers
    await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Approved Extension Request",
        actionTime: new Date(),
        oldStatus: unapprovedDeliverable.statusId as DeliverableStatus,
        newStatus: approvedDeliverable.statusId as DeliverableStatus,
        oldDueDate: unapprovedDeliverable.dueDate,
        newDueDate: finalDateGranted.easternTZDate,
        userId: context.user.id,
      },
      tx
    );
    await updateDeliverableExtension(
      input.deliverableExtensionId,
      {
        statusId: "Approved",
        finalDateGranted: finalDateGranted.easternTZDate,
      },
      tx
    );

    return approvedDeliverable;
  });
}
