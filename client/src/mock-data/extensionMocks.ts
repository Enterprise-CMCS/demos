import { DemonstrationStatus, Extension, User } from "demos-server";
import { mockUsers } from "./userMocks";
import { mockDemonstrationStatuses } from "./demonstrationStatusMocks";

export type MockExtension = Pick<Extension, "id" | "name"> & {
  projectOfficer: Pick<User, "fullName">;
  extensionStatus: Pick<DemonstrationStatus, "name">;
};

export const mockExtensions: MockExtension[] = [
  {
    id: "1",
    name: "Extension 1 - Montana Medicaid Waiver",
    projectOfficer: mockUsers[0],
    extensionStatus: mockDemonstrationStatuses[2],
  },
];
