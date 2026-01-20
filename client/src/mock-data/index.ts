import { demonstrationMocks } from "./demonstrationMocks";
import { eventMocks } from "./eventMocks";
import { personMocks } from "./personMocks";
import { tagMocks } from "./TagMocks";
import { userMocks } from "./userMocks";

export const ALL_MOCKS = [
  ...userMocks,
  ...demonstrationMocks,
  ...eventMocks,
  ...personMocks,
  ...tagMocks,
];
