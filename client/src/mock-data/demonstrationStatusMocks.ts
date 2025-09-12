import { DemonstrationStatus } from "demos-server";
import { demonstrationStatuses } from "data/DemonstrationStatuses";

export type MockDemonstrationStatus = Pick<DemonstrationStatus, "id" | "name">;

export const mockDemonstrationStatuses: readonly MockDemonstrationStatus[] =
  demonstrationStatuses;
