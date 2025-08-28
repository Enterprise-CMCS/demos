import { Amendment } from "demos-server";
import { MockDemonstrationStatus, mockDemonstrationStatuses } from "./demonstrationStatusMocks";
import { MockUser, mockUsers } from "./userMocks";

export type MockAmendment = Pick<Amendment, "id" | "name" | "effectiveDate"> & {
  projectOfficer: MockUser;
  amendmentStatus: MockDemonstrationStatus;
};

export const mockAmendments: MockAmendment[] = [
  {
    id: "1",
    name: "Amendment 1 - Montana Medicaid Waiver",
    effectiveDate: new Date("2025-01-01"),
    projectOfficer: mockUsers[0],
    amendmentStatus: mockDemonstrationStatuses[0],
  },
  {
    id: "2",
    name: "Amendment 2 - Montana Medicaid Waiver",
    effectiveDate: new Date("2025-02-02"),
    projectOfficer: mockUsers[0],
    amendmentStatus: mockDemonstrationStatuses[1],
  },
  {
    id: "3",
    name: "Amendment 3 - Florida Health Innovation",
    effectiveDate: new Date("2025-03-03"),
    projectOfficer: mockUsers[1],
    amendmentStatus: mockDemonstrationStatuses[1],
  },
  {
    id: "4",
    name: "Amendment 4 - Florida Health Innovation",
    effectiveDate: new Date("2025-04-04"),
    projectOfficer: mockUsers[2],
    amendmentStatus: mockDemonstrationStatuses[0],
  },
  {
    id: "5",
    name: "Amendment 5 - Florida Health Innovation",
    effectiveDate: new Date("2025-05-05"),
    projectOfficer: mockUsers[3],
    amendmentStatus: mockDemonstrationStatuses[3],
  },
];
