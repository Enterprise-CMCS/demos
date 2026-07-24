import {
  formatEasternTZDateToMMDDYYYY,
  parseJSDateToEasternTZDate,
  EasternTZDate,
} from "../../dateUtilities";
import {
  DeliverableAction,
  DeliverableActionType,
  DeliverableExtensionReasonCode,
  NonEmptyString,
  PersonType,
} from "../../types";
import { SelectDeliverableActionRowResult } from "./queries";

const PERSON_TYPE_DISPLAY_MAP = new Map<PersonType, string>([
  ["demos-admin", "Admin User"],
  ["demos-cms-user", "CMS User"],
  ["demos-state-user", "State User"],
]);

// Note: casts below are enforced by the database
export function formatFullUserName(input: SelectDeliverableActionRowResult): NonEmptyString {
  if (input.user) {
    const firstName = input.user.person.firstName;
    const lastName = input.user.person.lastName;
    const personType = PERSON_TYPE_DISPLAY_MAP.get(input.user.personTypeId as PersonType);
    return `${firstName} ${lastName} (${personType})`.trim();
  } else {
    return "System Update";
  }
}

function makeMarkedPastDueMessage(): string {
  return "The deliverable is past its due date";
}

function makeRequestedExtensionMessage(
  currentDue: EasternTZDate,
  newDue: EasternTZDate,
  reasonCode: DeliverableExtensionReasonCode,
  reasonDetails: string
): string {
  const formattedCurrentDue = formatEasternTZDateToMMDDYYYY(currentDue);
  const formattedNewDue = formatEasternTZDateToMMDDYYYY(newDue);
  return `Current Due Date: ${formattedCurrentDue}\nNew Due Date Requested: ${formattedNewDue}\nReason: ${reasonCode}\nReason Details: ${reasonDetails}`;
}

function makeApprovedExtensionMessage(newDue: EasternTZDate): string {
  const formattedNewDue = formatEasternTZDateToMMDDYYYY(newDue);
  return `Approved Due Date: ${formattedNewDue}`;
}

function makeDeniedExtensionMessage(denialReason: string): string {
  return `Denial Reason: ${denialReason}`;
}

function makeResubmissionRequestedOrDateChangedMessage(
  oldDueDate: EasternTZDate,
  newDueDate: EasternTZDate,
  reason: string
): string {
  const formattedOldDue = formatEasternTZDateToMMDDYYYY(oldDueDate);
  const formattedNewDue = formatEasternTZDateToMMDDYYYY(newDueDate);
  return `Old Due Date: ${formattedOldDue}\nNew Due Date: ${formattedNewDue}\nReason Details: ${reason}`;
}

export function formatDeliverableAction(input: SelectDeliverableActionRowResult): DeliverableAction {
  return {
    id: input.id,
    actionTimestamp: input.actionTimestamp,
    actionType: input.actionTypeId as DeliverableActionType,
    details: formatDetailsMessage(input),
    userFullName: formatFullUserName(input),
  };
}

export function formatDetailsMessage(input: SelectDeliverableActionRowResult): string {
  // Field existence enforced by database for all objects below
  switch (input.actionTypeId as DeliverableActionType) {
    case "Marked as Past Due":
      return makeMarkedPastDueMessage();

    case "Requested Extension":
      return makeRequestedExtensionMessage(
        parseJSDateToEasternTZDate(input.oldDueDate),
        parseJSDateToEasternTZDate(input.activeExtension!.originalDateRequested),
        input.activeExtension!.reasonCodeId as DeliverableExtensionReasonCode,
        input.note!
      );

    case "Approved Extension Request":
      return makeApprovedExtensionMessage(parseJSDateToEasternTZDate(input.newDueDate));

    case "Denied Extension Request":
      return makeDeniedExtensionMessage(input.note!);

    case "Requested Resubmission":
    case "Manually Changed Due Date":
      return makeResubmissionRequestedOrDateChangedMessage(
        parseJSDateToEasternTZDate(input.oldDueDate),
        parseJSDateToEasternTZDate(input.newDueDate),
        input.note!
      );

    default:
      return "";
  }
}
