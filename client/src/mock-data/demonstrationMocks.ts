import rawDemoData from "../faker_data/demonstrations.json";
import { states } from "../data/StatesAndTerritories";
import { demonstrationStatuses } from "./demonstrationStatusMocks";
import { MockedResponse } from "@apollo/client/testing";
import { DEMONSTRATIONS_TABLE } from "../pages/Demonstrations";
import {
  ADD_DEMONSTRATION_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
  GET_ALL_DEMONSTRATIONS_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "queries/demonstrationQueries";
import { johnDoe } from "./userMocks";
import { AddDemonstrationInput } from "demos-server";

function convertToUUID(originalId: string | number) {
  return `00000000-0000-0000-0000-${String(originalId).padStart(12, "0")}`;
}

interface JSONDemoData {
  id: string | number;
  title?: string;
  name?: string;
  description?: string;
  evaluationPeriodStartDate?: string;
  evaluationPeriodEndDate?: string;
  createdAt?: string;
  updatedAt?: string;
  demonstrationStatusId?: string | number;
  stateId?: string;
  projectOfficerUser?: string;
}

export function transformRawDemos(rawData: JSONDemoData[]) {
  return rawData.map((row) => {
    const stateMatch = states.find(
      (s) => s.abbreviation === row.stateId
    );

    const statusMatch = demonstrationStatuses.find(
      (status) => String(status.id) === String(row.demonstrationStatusId)
    );

    const randomEmail = () => {
      const randomStr = Math.random().toString(36).substring(2, 10);
      return `${randomStr}@example.com`;
    };

    const projectOfficer = row.projectOfficerUser
      ? {
        id: convertToUUID(row.id),
        displayName: row.projectOfficerUser || "John Doe",
        email: randomEmail(),
      }
      : null;

    return {
      id: convertToUUID(row.id),
      name: row.title || row.name,
      description: row.description,
      evaluationPeriodStartDate: row.evaluationPeriodStartDate
        ? new Date(row.evaluationPeriodStartDate)
        : null,
      evaluationPeriodEndDate: row.evaluationPeriodEndDate
        ? new Date(row.evaluationPeriodEndDate)
        : null,
      createdAt: row.createdAt
        ? new Date(row.createdAt)
        : new Date(),
      updatedAt: row.updatedAt
        ? new Date(row.updatedAt)
        : new Date(),
      demonstrationStatus: statusMatch
        ? {
          id: convertToUUID(statusMatch.id),
          name: statusMatch.name,
        }
        : null,
      demonstrationStatusId: statusMatch
        ? convertToUUID(statusMatch.id)
        : null,
      state: stateMatch
        ? {
          id: stateMatch.abbreviation,
          stateName: stateMatch.name,
          stateCode: stateMatch.abbreviation,
        }
        : null,
      stateName: stateMatch?.name || "",
      users: [],
      projectOfficerUser: projectOfficer,
      status: statusMatch?.name || "Unknown",
    };
  });
}

export const mockAddDemonstrationInput: AddDemonstrationInput = {
  name: "New Demonstration",
  description: "New Description",
  evaluationPeriodStartDate: new Date("2025-01-01"),
  evaluationPeriodEndDate: new Date("2025-12-31"),
  demonstrationStatusId: demonstrationStatuses[0].id,
  // stateId: states[4].abbrev,
  stateId: "dee7441f-151d-4a7d-a452-073d15e74082", // UPDATE STATE ID AS PK
  userIds: [johnDoe.id],
  projectOfficerUserId: johnDoe.id,
};

const sampleState = states.find(s => s.abbreviation === "MD")!;


export const testDemonstration = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Medicaid Illinois Tribal Demonstration",
  description: "This is a test demonstration record for unit tests.",
  evaluationPeriodStartDate: new Date("2025-01-01T00:00:00.000Z"),
  evaluationPeriodEndDate: new Date("2025-12-31T23:59:59.000Z"),
  createdAt: new Date("2025-01-01T12:00:00.000Z"),
  updatedAt: new Date("2025-02-01T12:00:00.000Z"),
  demonstrationStatus: {
    id: demonstrationStatuses[0].id,
    name: demonstrationStatuses[0].name,
  },
  demonstrationStatusId: demonstrationStatuses[0].id,
  state: {
    id: sampleState.abbreviation,
    stateName: sampleState.name,
    stateCode: sampleState.abbreviation,
  },
  stateName: sampleState.name,
  users: [],
  projectOfficerUser: {
    id: johnDoe.id,
    displayName: johnDoe.displayName,
    email: johnDoe.email,
  },
  status: demonstrationStatuses[0].name,
};

export const transformedDemonstrations = transformRawDemos(rawDemoData);

export const demonstrationMocks: MockedResponse[] = [
  {
    request: {
      query: DEMONSTRATIONS_TABLE,
    },
    result: {
      data: {
        demonstrations: transformedDemonstrations,
      },
    },
  },
  {
    request: {
      query: GET_ALL_DEMONSTRATIONS_QUERY,
    },
    result: {
      data: {
        demonstrations: transformedDemonstrations,
      },
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
        id: testDemonstration.id,
        input: {
          name: "Updated Demo Name",
          description: "Updated description",
          evaluationPeriodStartDate: new Date("2024-07-01T00:00:00.000Z"),
          evaluationPeriodEndDate: new Date("2024-07-31T00:00:00.000Z"),
          demonstrationStatusId: testDemonstration.demonstrationStatusId,
          stateId: testDemonstration.state?.id,
          userIds: [],
          projectOfficerUserId: testDemonstration.projectOfficerUser?.id,
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
