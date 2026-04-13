import {
  CreateDeliverableInput,
  DeliverableType,
  NonEmptyString,
  TagName,
  UpdateDeliverableInput,
} from "../../types";
import { EasternTZDate, parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities";
import { checkInputDateIsEndOfDay } from "../applicationDate";

export type ParsedCreateDeliverableInput = {
  name: NonEmptyString;
  deliverableType: DeliverableType;
  demonstrationId: string;
  cmsOwnerUserId: string;
  dueDate: EasternTZDate;
  demonstrationTypes?: TagName[];
};

export type ParsedUpdateDeliverableInput = {
  name?: NonEmptyString;
  deliverableType?: DeliverableType;
  cmsOwnerUserId?: string;
  dueDate?: EasternTZDate;
  demonstrationTypes?: TagName[];
};

export function parseCreateDeliverableInput(
  input: CreateDeliverableInput
): ParsedCreateDeliverableInput {
  const parsedDueDate = parseDateTimeOrLocalDateToEasternTZDate(input.dueDate, "End of Day");
  checkInputDateIsEndOfDay("dueDate", parsedDueDate);
  return {
    name: input.name,
    deliverableType: input.deliverableType,
    demonstrationId: input.demonstrationId,
    cmsOwnerUserId: input.cmsOwnerUserId,
    dueDate: parsedDueDate,
    demonstrationTypes: input.demonstrationTypes,
  };
}

export function parseUpdateDeliverableInput(
  input: UpdateDeliverableInput
): ParsedUpdateDeliverableInput {
  let parsedDueDate: EasternTZDate | undefined;
  if (input.dueDate) {
    parsedDueDate = parseDateTimeOrLocalDateToEasternTZDate(input.dueDate, "End of Day");
    checkInputDateIsEndOfDay("dueDate", parsedDueDate);
  }
  return {
    ...input,
    dueDate: parsedDueDate,
  };
}
