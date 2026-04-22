import { DeliverableStatus } from "../../types";
import {
  checkDueDateInFuture,
  editDeliverable,
  getDeliverable,
  ParsedUpdateDeliverableInput,
} from ".";
import { PrismaTransactionClient } from "../../prismaClient";
import { insertDeliverableAction } from "../deliverableAction/queries";
import { GraphQLContext } from "../../auth/auth.util";

export async function manuallyUpdateDeliverableDueDate(
  deliverableId: string,
  input: ParsedUpdateDeliverableInput,
  context: GraphQLContext,
  tx: PrismaTransactionClient
): Promise<void> {
  // Just do nothing if there's no date input
  if (!input.dueDate) {
    return undefined;
  }

  // Validate that new date is in the future
  const futureDateCheckResult = checkDueDateInFuture(input.dueDate.newDueDate);
  if (futureDateCheckResult) {
    throw new Error(futureDateCheckResult);
  }

  // Get current record to check dates, and check if they match
  const currentDeliverable = await getDeliverable({ id: deliverableId }, tx);
  const datesMatch =
    currentDeliverable.dueDate.valueOf() === input.dueDate.newDueDate.easternTZDate.valueOf();

  // Special handling for date changes when status is Past Due
  // Type is enforced by database
  const newStatus =
    currentDeliverable.statusId === "Past Due"
      ? "Upcoming"
      : (currentDeliverable.statusId as DeliverableStatus);

  // If the dates don't match, do an update
  if (!datesMatch) {
    await editDeliverable(
      deliverableId,
      {
        dueDate: input.dueDate.newDueDate.easternTZDate,
        statusId: newStatus,
      },
      tx
    );

    await insertDeliverableAction(
      {
        deliverableId: deliverableId,
        actionType: "Manually Changed Due Date",
        actionTime: new Date(),
        oldStatus: currentDeliverable.statusId as DeliverableStatus,
        newStatus: newStatus,
        note: input.dueDate.dateChangeNote,
        oldDueDate: currentDeliverable.dueDate,
        newDueDate: input.dueDate.newDueDate.easternTZDate,
        userId: context.user.id,
      },
      tx
    );
  }
}
