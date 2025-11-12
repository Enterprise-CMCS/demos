import { DemonstrationRoleAssignment } from "demos-server";
import { mockPeople, MockPerson } from "./personMocks";

export type MockDemonstrationRoleAssignment = Pick<
  DemonstrationRoleAssignment,
  "role" | "isPrimary"
> & {
  person: MockPerson;
};

export const mockDemonstrationRoleAssignments = [
  {
    role: "Project Officer",
    isPrimary: true,
    person: mockPeople[0],
  },
  {
    role: "Project Officer",
    isPrimary: true,
    person: mockPeople[1],
  },
  {
    role: "Project Officer",
    isPrimary: true,
    person: mockPeople[2],
  },
  {
    role: "DDME Analyst",
    isPrimary: true,
    person: mockPeople[3],
  },
  {
    role: "DDME Analyst",
    isPrimary: false,
    person: mockPeople[4],
  },
  {
    role: "Monitoring & Evaluation Technical Director",
    isPrimary: true,
    person: mockPeople[5],
  },
] as const satisfies MockDemonstrationRoleAssignment[];
