import { DemonstrationStatus, Extension, User } from "demos-server";
import { mockUsers } from "./userMocks";
import { mockDemonstrationStatuses } from "./demonstrationStatusMocks";

export type MockExtension = Pick<Extension, "id" | "name" | "effectiveDate"> & {
  projectOfficer: Pick<User, "fullName">;
  extensionStatus: Pick<DemonstrationStatus, "name">;
};

export const mockExtensions: MockExtension[] = [
  {
    id: "1",
    name: "Extension 1 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 0, 1),
    projectOfficer: mockUsers[0],
    extensionStatus: mockDemonstrationStatuses[2],
  },
  {
    id: "2",
    name: "Extension 2 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 1, 1),
    projectOfficer: mockUsers[1],
    extensionStatus: mockDemonstrationStatuses[1],
  },
];
