import { MockedResponse } from "@apollo/client/testing";
import { GET_DEMONSTRATION_STATUSES_FOR_SELECT } from "pages/Demonstrations/DemonstrationColumns";

export const demonstrationStatusMocks: MockedResponse[] = [
  {
    request: {
      query: GET_DEMONSTRATION_STATUSES_FOR_SELECT,
    },
    result: {
      data: { demonstrationStatuses: [
        {
          id: "1",
          name: "Approved",
        },
        {
          id: "2",
          name: "Expired",
        },
        {
          id: "2",
          name: "Withdrawn",
        },
      ]},
    },
  },
];
