import { demonstrationMocks } from "./demonstrationMocks";
import { demonstrationTypeAssignmentMocks } from "./DemonstrationTypeAssignmentMocks";
import { eventMocks } from "./eventMocks";
import { personMocks } from "./personMocks";
import { tagMocks } from "./TagMocks";
import { userMocks } from "./userMocks";

export * from "./workflowApplicationMocks";

export const ALL_MOCKS = [
  ...userMocks,
  ...demonstrationMocks,
  ...eventMocks,
  ...personMocks,
  ...tagMocks,
  ...demonstrationTypeAssignmentMocks,
];
