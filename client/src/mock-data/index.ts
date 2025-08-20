import { demonstrationMocks } from "./demonstrationMocks";
import { documentMocks } from "./documentMocks";
import { documentTypeMocks } from "./documentTypeMocks";
import { eventMocks } from "./event/eventMocks";
import { userMocks } from "./userMocks";

export const ALL_MOCKS = [
  ...userMocks,
  ...demonstrationMocks,
  ...eventMocks,
  ...documentMocks,
  ...documentTypeMocks,
];
