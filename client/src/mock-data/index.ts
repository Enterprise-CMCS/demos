import { demonstrationMocks } from "./demonstrationMocks";
import { demonstrationStatusMocks } from "./demonstrationStatusMocks";
import { documentMocks } from "./documentMocks";
import { stateMocks } from "./stateMocks";
import { userMocks } from "./userMocks";

export const ALL_MOCKS = [...userMocks, ...demonstrationMocks, ...stateMocks, ...documentMocks, ...demonstrationStatusMocks];
