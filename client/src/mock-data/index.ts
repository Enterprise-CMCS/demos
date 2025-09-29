import { demonstrationMocks } from "./demonstrationMocks";
import { demonstrationRoleAssignmentMocks } from "./demonstrationRoleAssignmentMocks";
import { eventMocks } from "./eventMocks";
import { personMocks } from "./personMocks";
import { userMocks } from "./userMocks";

export const ALL_MOCKS = [
  ...userMocks,
  ...demonstrationMocks,
  ...eventMocks,
  ...personMocks,
  ...demonstrationRoleAssignmentMocks,
];
