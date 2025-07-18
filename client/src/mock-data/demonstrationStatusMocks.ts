import { MockedResponse } from "@apollo/client/testing";
import {
  DemonstrationStatusSelectOptions,
  GET_DEMONSTRATION_STATUSES_FOR_SELECT,
} from "pages/Demonstrations/DemonstrationColumns";

export const demonstrationStatusMocks: MockedResponse[] = [
  {
    request: {
      query: GET_DEMONSTRATION_STATUSES_FOR_SELECT,
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
        ] satisfies DemonstrationStatusSelectOptions[],
      },
    },
  },
];
