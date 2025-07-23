import {
  AddDemonstrationInput,
  Demonstration,
} from "demos-server";
import { california, texas } from "./stateMocks";
import { johnDoe, testUser2 } from "./userMocks";
import {
  ADD_DEMONSTRATION_QUERY,
  GET_ALL_DEMONSTRATIONS_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "queries/demonstrationQueries";
import { MockedResponse } from "@apollo/client/testing";
import { approvedDemonstrationStatus, expiredDemonstrationStatus, withdrawnDemonstrationStatus } from "./demonstrationStatusMocks";



export const testDemonstration: Demonstration = {
  id: "1",
  name: "Test Demonstration",
  description: "Test Description",
  evaluationPeriodStartDate: new Date("2025-01-01"),
  evaluationPeriodEndDate: new Date("2025-12-31"),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  demonstrationStatus: approvedDemonstrationStatus,
  state: california,
  users: [johnDoe],
  projectOfficer: johnDoe,
};

export const testDemonstration2: Demonstration = {
  id: "1",
  name: "Test Demonstration Two",
  description: "Test Description Two",
  evaluationPeriodStartDate: new Date("2025-02-02"),
  evaluationPeriodEndDate: new Date("2025-12-31"),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-02-02"),
  demonstrationStatus: expiredDemonstrationStatus,
  state: california,
  users: [testUser2],
  projectOfficer: johnDoe,
};

export const testDemonstration3: Demonstration = {
  id: "1",
  name: "Test Demonstration Three",
  description: "Test Description three",
  evaluationPeriodStartDate: new Date("2025-03-03"),
  evaluationPeriodEndDate: new Date("2025-12-31"),
  createdAt: new Date("2025-03-03"),
  updatedAt: new Date("2025-03-03"),
  demonstrationStatus: withdrawnDemonstrationStatus,
  state: texas,
  users: [johnDoe, testUser2],
  projectOfficer: testUser2,
};

export const mockAddDemonstrationInput: AddDemonstrationInput = {
  name: "New Demonstration",
  description: "New Description",
  evaluationPeriodStartDate: new Date("2025-01-01"),
  evaluationPeriodEndDate: new Date("2025-12-31"),
  demonstrationStatusId: approvedDemonstrationStatus.id,
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
      data: { demonstrations: [testDemonstration, testDemonstration2, testDemonstration3] },
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
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: "1",
        input: {
          name: "Updated Demo Name",
          description: "Updated description",
          evaluationPeriodStartDate: new Date("2024-07-01T00:00:00.000Z"),
          evaluationPeriodEndDate: new Date("2024-07-31T00:00:00.000Z"),
          demonstrationStatusId: "1",
          stateId: "1",
          userIds: ["1"],
        },
      },
    },
    result: {
      data: {
        updateDemonstration: {
          ...testDemonstration,
          name: "Updated Demo Name",
          description: "Updated description",
          evaluationPeriodStartDate: new Date("2024-07-01T00:00:00.000Z"),
          evaluationPeriodEndDate: new Date("2024-07-31T00:00:00.000Z"),
          updatedAt: new Date("2024-07-01T00:00:00.000Z"),
        },
      },
    },
  },
];
