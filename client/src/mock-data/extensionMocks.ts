import { DemonstrationStatus, Extension } from "demos-server";
import { DEMONSTRATION_STATUSES } from "demos-server-constants";

const demonstrationStatuses: Pick<DemonstrationStatus, "id" | "name">[] = DEMONSTRATION_STATUSES.map(
  (s) => ({ id: s.id, name: s.name })
);

export type MockExtension = Pick<Extension, "id" | "name" | "effectiveDate"> & {
  extensionStatus: Pick<DemonstrationStatus, "name">;
};

export const mockExtensions = [
  {
    id: "1",
    name: "Extension 1 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 0, 1),
    extensionStatus: demonstrationStatuses.find((s) => s.name === "Under Review")!,
  },
  {
    id: "2",
    name: "Extension 2 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 1, 1),
    extensionStatus: demonstrationStatuses.find((s) => s.name === "Approved")!,
  },
  {
    id: "3",
    name: "Extension 3 - Montana Medicaid Waiver",
    effectiveDate: null,
    extensionStatus: demonstrationStatuses.find((s) => s.name === "Approved")!,
  },
] as const satisfies MockExtension[];
