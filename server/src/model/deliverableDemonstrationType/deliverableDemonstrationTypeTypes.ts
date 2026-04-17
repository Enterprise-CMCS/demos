import { TagName } from "../../types";

export type SetDeliverableDemonstrationTypesInput = {
  deliverableId: string;
  demonstrationId: string;
  demonstrationTypes: TagName[];
};
