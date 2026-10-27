import { MockedResponse } from "@apollo/client/testing";
import { CONTACTS_TABLE_QUERY } from "components/table/tables/ContactsTable";
import { mockPeople } from "./personMocks";

export const contactMocks: MockedResponse[] = [
  {
    request: {
      query: CONTACTS_TABLE_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: {
        demonstration: {
          roles: [
            {
              isPrimary: true,
              role: "Project Officer",
              person: {
                id: mockPeople[0].id,
                fullName: mockPeople[0].fullName,
                email: mockPeople[0].email,
              },
            },
            {
              isPrimary: false,
              role: "State Point of Contact",
              person: {
                id: mockPeople[1].id,
                fullName: mockPeople[1].fullName,
                email: mockPeople[1].email,
              },
            },
          ],
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];
