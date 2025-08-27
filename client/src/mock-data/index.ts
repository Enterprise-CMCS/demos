import { demonstrationMocks } from "./demonstrationMocks";
import { documentMocks } from "./documentMocks";
import { eventMocks } from "./event/eventMocks";
import { userMocks } from "./userMocks";

export const ALL_MOCKS = [
  ...userMocks,
  ...demonstrationMocks,
  ...eventMocks,
  ...documentMocks,
];
