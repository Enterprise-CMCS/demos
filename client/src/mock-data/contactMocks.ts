import { MockedResponse } from "@apollo/client/testing";
import { CONTACTS_TABLE_QUERY } from "components/table/tables/ContactsTable";
import { MOCK_DEMONSTRATION_ROLES } from "./demonstrationRoleAssignmentMocks";

export const contactMocks: MockedResponse[] = [
  {
    request: {
      query: CONTACTS_TABLE_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: {
        demonstration: {
          roles: MOCK_DEMONSTRATION_ROLES.map(({ role, isPrimary, person }) => ({
            role,
            isPrimary,
            person: { id: person.id, fullName: person.fullName, email: person.email },
          })),
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];
