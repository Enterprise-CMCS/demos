import { demonstrationMocks } from "./demonstrationMocks";
import { demonstrationStatusMocks } from "./demonstrationStatusMocks";
import { eventMocks } from "./event/eventMocks";
import { stateMocks } from "./stateMocks";
import { userMocks } from "./userMocks";

export const ALL_MOCKS = [
  ...userMocks,
  ...demonstrationMocks,
  ...eventMocks,
  ...stateMocks,
  ...demonstrationStatusMocks,
];
