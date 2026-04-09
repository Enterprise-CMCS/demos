import { CreateDeliverableInput } from "../../types";
import { ParsedCreateDeliverableInput } from ".";
import { parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities";
import { checkInputDateIsEndOfDay } from "../applicationDate";

export function parseCreateDeliverableInput(
  input: CreateDeliverableInput,
  cmsOwnerUserId: string
): ParsedCreateDeliverableInput {
  const parsedDueDate = parseDateTimeOrLocalDateToEasternTZDate(input.dueDate, "End of Day");
  checkInputDateIsEndOfDay("dueDate", parsedDueDate);
  return {
    name: input.name,
    deliverableType: input.deliverableType,
    demonstrationId: input.demonstrationId,
    cmsOwnerUserId: cmsOwnerUserId,
    dueDate: parsedDueDate,
    demonstrationTypes: input.demonstrationTypes,
  };
}
