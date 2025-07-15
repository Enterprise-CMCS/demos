import rawDemoData from "../faker_data/demonstrations.json";
import { states } from "../data/StatesAndTerritories";
import { demonstrationStatuses } from "./demonstrationStatusMocks";
import { MockedResponse } from "@apollo/client/testing";
import { DEMONSTRATIONS_TABLE } from "../pages/Demonstrations";

function convertToUUID(originalId: string | number) {
  return `00000000-0000-0000-0000-${String(originalId).padStart(12, "0")}`;
}

// This is just the type for the JSON data structure.
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
      (s) => s.abbrev === row.stateId
    );

    // Match is working
    const statusMatch = demonstrationStatuses.find(
      (status) => String(status.id) === String(row.demonstrationStatusId)
    );

    const randomEmail = () => {
      const randomStr = Math.random().toString(36).substring(2, 10);
      return `${randomStr}@example.com`;
    };
    // Instead of joining userMocks, just use projectOfficerUser
    const projectOfficer = row.projectOfficerUser
      ? {
        id: row.id,
        displayName: row.projectOfficerUser || "John Doe",
        email: randomEmail(),
      }
      : null;

    return {
      id: convertToUUID(row.id),
      name: row.title || row.name, // <-- ensure 'title' is present
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
          id: statusMatch.id,
          name: statusMatch.name,
        }
        : null,
      demonstrationStatusId: statusMatch
        ? statusMatch.id
        : null,
      state: stateMatch
        ? {
          id: stateMatch.abbrev,
          stateName: stateMatch.name,
          stateCode: stateMatch.abbrev,
        }
        : null,
      stateName: stateMatch?.name || "",
      users: [],
      projectOfficerUser: projectOfficer,
      status: statusMatch?.name || "Unknown",
    };
  });
}

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
];
