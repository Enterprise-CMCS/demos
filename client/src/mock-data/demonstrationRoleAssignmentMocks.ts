import { DemonstrationRoleAssignment } from "demos-server";
import { mockPerson } from "./personMocks";
import { mockDemonstration } from "./demonstrationMocks";

export const primaryProjectOfficerRoleAssignment: DemonstrationRoleAssignment = {
  role: "Project Officer",
  isPrimary: true,
  person: mockPerson,
  demonstration: mockDemonstration,
};
