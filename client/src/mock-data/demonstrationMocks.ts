import { Demonstration } from "demos-server";
import { activeDemonstrationStatus } from "./demonstrationStatusMocks";
import { california } from "./stateMocks";
import { johnDoe } from "./userMocks";
import { GET_ALL_DEMONSTRATIONS } from "queries/demonstrationQueries";
import { MockedResponse } from "@apollo/client/testing";

export const testDemonstration: Demonstration = {
  id: "1",
  name: "Test Demonstration",
  description: "Test Description",
  evaluationPeriodStartDate: new Date("2025-01-01"),
  evaluationPeriodEndDate: new Date("2025-12-31"),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  demonstrationStatus: activeDemonstrationStatus,
  state: california,
  users: [johnDoe],
};

export const demonstrationMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_DEMONSTRATIONS,
    },
    result: {
      data: { demonstrations: [testDemonstration] },
    },
  },
];
