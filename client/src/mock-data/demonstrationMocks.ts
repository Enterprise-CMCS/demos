import { AddDemonstrationInput, Demonstration } from "demos-server";
import { activeDemonstrationStatus } from "./demonstrationStatusMocks";
import { california } from "./stateMocks";
import { johnDoe } from "./userMocks";
import {
  ADD_DEMONSTRATION_QUERY,
  GET_ALL_DEMONSTRATIONS_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
} from "queries/demonstrationQueries";
import { DEMONSTRATIONS_TABLE_QUERY } from "pages/Demonstrations";
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
  projectOfficer: johnDoe,
};

export const mockAddDemonstrationInput: AddDemonstrationInput = {
  name: "New Demonstration",
  description: "New Description",
  evaluationPeriodStartDate: new Date("2025-01-01"),
  evaluationPeriodEndDate: new Date("2025-12-31"),
  demonstrationStatusId: activeDemonstrationStatus.id,
  stateId: california.id,
  userIds: [johnDoe.id],
  projectOfficerUserId: johnDoe.id,
};

export const demonstrationMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_DEMONSTRATIONS_QUERY,
    },
    result: {
      data: { demonstrations: [testDemonstration] },
    },
  },

  {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: testDemonstration.id },
    },
    result: {
      data: { demonstration: testDemonstration },
    },
  },

  {
    request: {
      query: ADD_DEMONSTRATION_QUERY,
      variables: { input: mockAddDemonstrationInput },
    },
    result: {
      data: { addDemonstration: testDemonstration },
    },
  },

  {
    request: {
      query: ADD_DEMONSTRATION_QUERY,
      variables: { input: { name: "bad add demonstration" } },
    },
    error: new Error("Failed to add demonstration"),
  },
  {
    request: {
      query: DEMONSTRATIONS_TABLE_QUERY,
    },
    result: {
      data: {
        demonstrations: [
          {
            ...testDemonstration,
          },
        ],
      },
    },
  },
];
