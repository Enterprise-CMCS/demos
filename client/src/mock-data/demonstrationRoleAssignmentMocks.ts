import { DemonstrationRoleAssignment } from "demos-server";
import { mockPeople, MockPerson } from "./personMocks";
import { MockedResponse } from "@apollo/client/testing";
import { UNSET_DEMONSTRATION_ROLE_MUTATION } from "components/dialog/RemoveContactDialog";

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

export const demonstrationRoleAssignmentMocks: MockedResponse[] = [
  {
    request: {
      query: UNSET_DEMONSTRATION_ROLE_MUTATION,
      variables: {
        input: [
          {
            personId: mockDemonstrationRoleAssignments[0].person.id,
            demonstrationId: "1",
            roleId: mockDemonstrationRoleAssignments[0].role,
          },
          {
            personId: mockDemonstrationRoleAssignments[1].person.id,
            demonstrationId: "1",
            roleId: mockDemonstrationRoleAssignments[1].role,
          },
        ],
      },
    },
    result: {
      data: {
        unsetRoleAssignments: [
          mockDemonstrationRoleAssignments[0],
          mockDemonstrationRoleAssignments[1],
        ],
      },
    },
  },
];
