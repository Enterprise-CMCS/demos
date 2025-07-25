import { AddDemonstrationInput, Demonstration } from "demos-server";
import { activeDemonstrationStatus } from "./demonstrationStatusMocks";
import { california } from "./stateMocks";
import { johnDoe } from "./userMocks";
import {
  ADD_DEMONSTRATION_QUERY,
  DEMONSTRATION_TABLE_QUERY,
  GET_ALL_DEMONSTRATIONS_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "queries/demonstrationQueries";
import { MockedResponse } from "@apollo/client/testing";
import { DemonstrationTableRow } from "hooks/useDemonstration";

export const testDemonstration: Demonstration = {
  id: "1",
  name: "Test Demonstration",
  description: "Test Description",
  effectiveDate: new Date("2025-01-01"),
  expirationDate: new Date("2025-12-31"),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  demonstrationStatus: activeDemonstrationStatus,
  state: california,
  users: [johnDoe],
};

export const mockAddDemonstrationInput: AddDemonstrationInput = {
  name: "New Demonstration",
  description: "New Description",
  effectiveDate: new Date("2025-01-01"),
  expirationDate: new Date("2025-12-31"),
  demonstrationStatusId: activeDemonstrationStatus.id,
  stateId: california.id,
  userIds: [johnDoe.id],
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
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: "1",
        input: {
          name: "Updated Demo Name",
          description: "Updated description",
          effectiveDate: new Date("2024-07-01T00:00:00.000Z"),
          expirationDate: new Date("2024-07-31T00:00:00.000Z"),
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
          effectiveDate: new Date("2024-07-01T00:00:00.000Z"),
          expirationDate: new Date("2024-07-31T00:00:00.000Z"),
          updatedAt: new Date("2024-07-01T00:00:00.000Z"),
        },
      },
    },
  },
  {
    request: {
      query: DEMONSTRATION_TABLE_QUERY,
    },
    result: {
      data: {
        demonstrations: [
          {
            id: "1",
            name: "Montana Medicaid Waiver",
            demonstrationStatus: { name: "Approved" },
            state: { name: "Montana" },
            projectOfficer: { fullName: "John Doe" },
            users: [{ id: "1" }],
          },
          {
            id: "2",
            name: "Florida Health Innovation",
            demonstrationStatus: { name: "Expired" },
            state: { name: "Florida" },
            projectOfficer: { fullName: "Jane Smith" },
            users: [{ id: "2" }],
          },
          {
            id: "3",
            name: "Texas Reform Initiative",
            demonstrationStatus: { name: "Withdrawn" },
            state: { name: "Texas" },
            projectOfficer: { fullName: "Bob Johnson" },
            users: [{ id: "1" }],
          },
        ] satisfies DemonstrationTableRow[],
      },
    },
  },
];
