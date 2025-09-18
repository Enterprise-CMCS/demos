import { Amendment } from "demos-server";
import { DEMONSTRATION_STATUSES } from "demos-server-constants";
import type { DemonstrationStatus } from "demos-server";

const demonstrationStatuses: ReadonlyArray<Pick<DemonstrationStatus, "id" | "name">> =
  DEMONSTRATION_STATUSES.map((s) => ({ id: s.id, name: s.name }));

export type MockAmendment = Pick<Amendment, "id" | "name" | "effectiveDate"> & {
  amendmentStatus: Pick<DemonstrationStatus, "name">;
};

export const mockAmendments = [
  {
    id: "1",
    name: "Amendment 1 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 0, 1),
    amendmentStatus: demonstrationStatuses.find((s) => s.name === "Under Review")!,
  },
  {
    id: "2",
    name: "Amendment 2 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 1, 1),
    amendmentStatus: demonstrationStatuses.find((s) => s.name === "Approved")!,
  },
  {
    id: "3",
    name: "Amendment 3 - Florida Health Innovation",
    effectiveDate: new Date(2025, 2, 1),
    amendmentStatus: demonstrationStatuses.find((s) => s.name === "Approved")!,
  },
  {
    id: "4",
    name: "Amendment 4 - Florida Health Innovation",
    effectiveDate: new Date(2025, 3, 1),
    amendmentStatus: demonstrationStatuses.find((s) => s.name === "Under Review")!,
  },
  {
    id: "5",
    name: "Amendment 5 - Florida Health Innovation",
    effectiveDate: new Date(2025, 4, 1),
    amendmentStatus: demonstrationStatuses[3],
  },
  {
    id: "6",
    name: "Amendment 6 - Florida Health Innovation",
    effectiveDate: null,
    amendmentStatus: demonstrationStatuses[3],
  },
] as const satisfies MockAmendment[];
