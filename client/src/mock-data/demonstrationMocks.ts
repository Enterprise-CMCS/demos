import rawDemoData from "../faker_data/demonstrations_take_2.json";
import { states } from "../data/StatesAndTerritories";
import { demonstrationStatuses } from "./demonstrationStatusMocks";
import { MockedResponse } from "@apollo/client/testing";
import { DEMONSTRATIONS_TABLE } from "../pages/Demonstrations";

function convertToUUID(originalId: string | number) {
  return `00000000-0000-0000-0000-${String(originalId).padStart(12, "0")}`;
}

export function transformRawDemos(rawData: any[]) {
  return rawData.map((row) => {
    const stateMatch = states.find(
      (s) => s.abbrev === row.stateId
    );

    const statusMatch = demonstrationStatuses.find(
      (status) => String(status.id) === String(row.demonstrationStatusId)
    );

    // Instead of joining userMocks, just use projectOfficerUser
    const projectOfficer = row.projectOfficerUser
      ? {
        id: convertToUUID(row.projectOfficerUserId),
        fullName: row.projectOfficerUser,
        displayName: row.projectOfficerUser,
      }
      : null;

    return {
      id: convertToUUID(row.id),
      name: row.name,
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
          id: convertToUUID(stateMatch.abbrev),
          stateName: stateMatch.name,
          stateCode: stateMatch.abbrev,
        }
        : null,
      stateName: stateMatch?.name || "",
      users: [],
      projectOfficer: projectOfficer,
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
