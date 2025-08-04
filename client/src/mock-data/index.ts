import { demonstrationMocks } from "./demonstrationMocks";
import { demonstrationStatusMocks } from "./demonstrationStatusMocks";
import { documentMocks } from "./documentMocks";
import { documentTypeMocks } from "./documentTypeMocks";
import { eventMocks } from "./event/eventMocks";
import { stateMocks } from "./stateMocks";
import { userMocks } from "./userMocks";

export const ALL_MOCKS = [
  ...userMocks,
  ...demonstrationMocks,
  ...eventMocks,
  ...stateMocks,
  ...demonstrationStatusMocks,
  ...documentMocks,
  ...documentTypeMocks,
];
