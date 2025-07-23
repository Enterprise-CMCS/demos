import { MockedResponse } from "@apollo/client/testing";
import { GET_ALL_DEMONSTRATION_STATUSES_QUERY } from "hooks/useDemonstrationStatus";

export const demonstrationStatusMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_DEMONSTRATION_STATUSES_QUERY,
    },
    result: {
      data: {
        demonstrationStatuses: [
          {
            name: "Approved",
          },
          {
            name: "Expired",
          },
          {
            name: "Withdrawn",
          },
        ],
      },
    },
  },
];
