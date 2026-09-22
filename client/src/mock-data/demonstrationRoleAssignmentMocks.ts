import { Demonstration, DemonstrationRoleAssignment } from "demos-server";
import { mockPerson } from "./personMocks";

export const primaryProjectOfficerRoleAssignment: DemonstrationRoleAssignment = {
  role: "Project Officer",
  isPrimary: true,
  person: mockPerson,
  demonstration: {} as Demonstration,
};
