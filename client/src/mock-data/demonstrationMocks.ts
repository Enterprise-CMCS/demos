import rawDemoData from "../faker_data/demonstrations_take_2.json";
import { states } from "../data/StatesAndTerritories";
import { demonstrationStatuses } from "./demonstrationStatusMocks";
import { userMocks } from "./userMocks";
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

    // Instead of trying to join with userMocks, just use the projectOfficerUser string
    const projectOfficer = row.projectOfficerUser
      ? {
        id: convertToUUID(row.projectOfficerUserId),
        fullName: row.projectOfficerUser,
        displayName: row.projectOfficerUser,
      }
      : null;

    const users = userMocks.filter(
      (user) => row.userIds?.includes(String(user.id))
    );

    return {
      id: convertToUUID(row.id),
      name: row.name,
      description: row.description,
      demonstrationStatus: statusMatch
        ? {
          id: convertToUUID(statusMatch.id),
          name: statusMatch.name,
        }
        : null,
      state: stateMatch
        ? {
          id: convertToUUID(stateMatch.abbrev),
          stateName: stateMatch.name,
          stateCode: stateMatch.abbrev,
        }
        : null,
      users: users.map((u) => ({
        id: convertToUUID(u.id),
        fullName: u.fullName,
      })),
      projectOfficer: projectOfficer,
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
