import { MockedResponse } from "@apollo/client/testing";
import { DemonstrationStatus } from "demos-server";
import { GET_ALL_DEMONSTRATION_STATUSES_QUERY } from "hooks/useDemonstrationStatus";

export const approvedDemonstrationStatus: DemonstrationStatus = {
  id: "1",
  name: "Approved",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  description: "Approved Demonstration Status",
  demonstrations: [],
};


export const expiredDemonstrationStatus: DemonstrationStatus = {
  id: "2",
  name: "Expired",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  description: "Expired Demonstration Status",
  demonstrations: [],
};

export const withdrawnDemonstrationStatus: DemonstrationStatus = {
  id: "3",
  name: "Withdrawn",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  description: "Withdrawn Demonstration Status",
  demonstrations: [],
};


export const demonstrationStatusMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_DEMONSTRATION_STATUSES_QUERY,
    },
    result: {
      data: {
        demonstrationStatuses: [
          approvedDemonstrationStatus,
          expiredDemonstrationStatus,
          withdrawnDemonstrationStatus,
        ],
      },
    },
  },
];
