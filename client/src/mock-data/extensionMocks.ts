import { DemonstrationStatus, Extension, User } from "demos-server";
import { mockUsers } from "./userMocks";
import { mockDemonstrationStatuses } from "./demonstrationStatusMocks";

export type MockExtension = Pick<Extension, "id" | "name" | "effectiveDate"> & {
  projectOfficer: Pick<User, "fullName">;
  extensionStatus: Pick<DemonstrationStatus, "name">;
};

export const mockExtensions = [
  {
    id: "1",
    name: "Extension 1 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 0, 1),
    projectOfficer: mockUsers[0],
    extensionStatus: mockDemonstrationStatuses.find((s) => s.name === "Pending")!,
  },
  {
    id: "2",
    name: "Extension 2 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 1, 1),
    projectOfficer: mockUsers[1],
    extensionStatus: mockDemonstrationStatuses.find((s) => s.name === "Approved")!,
  },
  {
    id: "3",
    name: "Extension 3 - Montana Medicaid Waiver",
    effectiveDate: null,
    projectOfficer: mockUsers[1],
    extensionStatus: mockDemonstrationStatuses.find((s) => s.name === "Approved")!,
  },
] as const satisfies MockExtension[];
