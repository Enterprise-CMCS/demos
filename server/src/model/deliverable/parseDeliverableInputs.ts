import {
  CreateDeliverableInput,
  DeliverableType,
  NonEmptyString,
  TagName,
  UpdateDeliverableInput,
} from "../../types";
import { EasternTZDate, parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities";
import { checkInputDateIsEndOfDay } from "../applicationDate";
import { checkForDuplicateDemonstrationTypes } from ".";

export type ParsedCreateDeliverableInput = {
  name: NonEmptyString;
  deliverableType: DeliverableType;
  demonstrationId: string;
  cmsOwnerUserId: string;
  dueDate: EasternTZDate;
  demonstrationTypes?: Set<TagName>;
};

export type ParsedUpdateDueDate = {
  newDueDate: EasternTZDate;
  dateChangeNote: NonEmptyString;
};

export type ParsedUpdateDeliverableInput = {
  name?: NonEmptyString;
  deliverableType?: DeliverableType;
  cmsOwnerUserId?: string;
  dueDate?: ParsedUpdateDueDate;
  demonstrationTypes?: Set<TagName>;
};

export function parseCreateDeliverableInput(
  input: CreateDeliverableInput
): ParsedCreateDeliverableInput {
  const parsedDueDate = parseDateTimeOrLocalDateToEasternTZDate(input.dueDate, "End of Day");
  checkInputDateIsEndOfDay("dueDate", parsedDueDate);

  const result: ParsedCreateDeliverableInput = {
    name: input.name,
    deliverableType: input.deliverableType,
    demonstrationId: input.demonstrationId,
    cmsOwnerUserId: input.cmsOwnerUserId,
    dueDate: parsedDueDate,
  };

  if (input.demonstrationTypes) {
    const duplicateCheckResult = checkForDuplicateDemonstrationTypes(input.demonstrationTypes);
    if (duplicateCheckResult) {
      throw new Error(duplicateCheckResult);
    }
    result.demonstrationTypes = new Set(input.demonstrationTypes);
  }

  return result;
}

export function parseUpdateDeliverableInput(
  input: UpdateDeliverableInput
): ParsedUpdateDeliverableInput {
  const { dueDate: inputDueDate, demonstrationTypes: inputDemonstrationTypes, ...rest } = input;
  const result: ParsedUpdateDeliverableInput = { ...rest };

  if (inputDueDate) {
    const parsedDueDate = parseDateTimeOrLocalDateToEasternTZDate(
      inputDueDate.newDueDate,
      "End of Day"
    );
    checkInputDateIsEndOfDay("dueDate", parsedDueDate);
    result.dueDate = {
      newDueDate: parsedDueDate,
      dateChangeNote: inputDueDate.dateChangeNote,
    };
  }

  if (inputDemonstrationTypes) {
    const duplicateCheckResult = checkForDuplicateDemonstrationTypes(inputDemonstrationTypes);
    if (duplicateCheckResult) {
      throw new Error(duplicateCheckResult);
    }
    result.demonstrationTypes = new Set(inputDemonstrationTypes);
  }

  return result;
}
