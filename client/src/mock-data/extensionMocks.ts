import { DemonstrationStatus, Extension, User } from "demos-server";
import { mockUsers } from "./userMocks";
import { DEMONSTRATION_STATUSES } from "demos-server-constants";

const demonstrationStatuses: Pick<DemonstrationStatus, "id" | "name">[] =
  DEMONSTRATION_STATUSES.map((s) => ({ id: s.id, name: s.name }));

export type MockExtension = Pick<Extension, "id" | "name" | "effectiveDate"> & {
  projectOfficer: Pick<User, "fullName">;
  extensionStatus: Pick<DemonstrationStatus, "name">;
  __typename: "Extension";
};

export const mockExtensions = [
  {
    __typename: "Extension",
    id: "1",
    name: "Extension 1 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 0, 1),
    projectOfficer: mockUsers[0],
    extensionStatus: demonstrationStatuses.find((s) => s.name === "Under Review")!,
  },
  {
    __typename: "Extension",
    id: "2",
    name: "Extension 2 - Montana Medicaid Waiver",
    effectiveDate: new Date(2025, 1, 1),
    projectOfficer: mockUsers[1],
    extensionStatus: demonstrationStatuses.find((s) => s.name === "Approved")!,
  },
  {
    __typename: "Extension",
    id: "3",
    name: "Extension 3 - Montana Medicaid Waiver",
    effectiveDate: null,
    projectOfficer: mockUsers[1],
    extensionStatus: demonstrationStatuses.find((s) => s.name === "Approved")!,
  },
] as const satisfies MockExtension[];
