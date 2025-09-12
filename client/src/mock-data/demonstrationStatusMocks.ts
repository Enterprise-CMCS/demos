import { DemonstrationStatus } from "demos-server";
import { DEMONSTRATION_STATUSES } from "demos-server-constants";

export type MockDemonstrationStatus = Pick<DemonstrationStatus, "id" | "name">;

// Mutable copy derived from backend constants (id, name only)
export const mockDemonstrationStatuses: MockDemonstrationStatus[] = DEMONSTRATION_STATUSES.map(
  (status) => ({ id: status.id, name: status.name })
);
