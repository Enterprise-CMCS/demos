import { EasternTZDate } from "../../dateUtilities";
import { DeliverableType, NonEmptyString, TagName } from "../../types";

export type ParsedCreateDeliverableInput = {
  name: NonEmptyString;
  deliverableType: DeliverableType;
  demonstrationId: string;
  cmsOwnerUserId: string;
  dueDate: EasternTZDate;
  demonstrationTypes?: TagName[];
};
