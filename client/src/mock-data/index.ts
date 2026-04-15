import { deliverableMocks } from "./deliverableMocks";
import { demonstrationMocks } from "./demonstrationMocks";
import { demonstrationTypeAssignmentMocks } from "./DemonstrationTypeAssignmentMocks";
import { eventMocks } from "./eventMocks";
import { personMocks } from "./personMocks";
import { tagMocks } from "./TagMocks";
import { userMocks } from "./userMocks";
import { workflowMocks } from "./workflowMocks";

export const ALL_MOCKS = [
  ...userMocks,
  ...demonstrationMocks,
  ...eventMocks,
  ...personMocks,
  ...tagMocks,
  ...demonstrationTypeAssignmentMocks,
  ...workflowMocks,
  ...deliverableMocks,
];
