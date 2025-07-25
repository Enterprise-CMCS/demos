import { MockedResponse } from "@apollo/client/testing";
import { DemonstrationStatus } from "demos-server";
import { DemonstrationStatusOption } from "hooks/useDemonstrationStatus";
import { DEMONSTRATION_STATUS_OPTIONS_QUERY } from "queries/demonstrationStatusQueries";

export const activeDemonstrationStatus: DemonstrationStatus = {
  id: "1",
  name: "Active",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  description: "Active Demonstration Status",
};

export const demonstrationStatusMocks: MockedResponse[] = [
  {
    request: {
      query: DEMONSTRATION_STATUS_OPTIONS_QUERY,
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
        ] satisfies DemonstrationStatusOption[],
      },
    },
  },
];
