import { MockedResponse } from "@apollo/client/testing";
import {
  ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
  SetDemonstrationTypesInput,
} from "components/dialog/DemonstrationTypes/useApplyDemonstrationTypesDialogData";

import { Tag } from "demos-server";

// TODO: replace this with server type with updated DemonstrationTypeName field when available
export type MockDemonstrationTypeAssignment = {
  demonstrationTypeName: Tag;
  effectiveDate: Date;
  expirationDate: Date;
};

export const MOCK_DEMONSTRATION_TYPE_ASSIGNMENTS: MockDemonstrationTypeAssignment[] = [
  {
    demonstrationTypeName: "Aggregate Cap",
    effectiveDate: new Date("2025-01-01"),
    expirationDate: new Date("2025-12-31"),
  },
  {
    demonstrationTypeName: "Annual Limits",
    effectiveDate: new Date("2025-02-01"),
    expirationDate: new Date("2025-11-30"),
  },
  {
    demonstrationTypeName: "Basic Health Plan (BHP)",
    effectiveDate: new Date("2025-03-01"),
    expirationDate: new Date("2025-10-31"),
  },
];

// simple mock to verify persistence; just returns the input data
export const demonstrationTypeAssignmentMocks: MockedResponse[] = [
  {
    request: {
      query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
    },
    variableMatcher: (variables) => {
      return variables.input.demonstrationId === "1";
    },
    result: (variables: { input: SetDemonstrationTypesInput }) => ({
      data: {
        setDemonstrationTypes: {
          __typename: "Demonstration",
          id: variables.input.demonstrationId,
          demonstrationTypes: variables.input.demonstrationTypes
            .filter((dt) => dt.dates !== null)
            .map((dt) => ({
              demonstrationTypeName: dt.demonstrationTypeName,
              effectiveDate: dt.dates!.effectiveDate,
              expirationDate: dt.dates!.expirationDate,
            })),
        },
      },
    }),
    maxUsageCount: Infinity,
  },
  {
    request: {
      query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
    },
    variableMatcher: (variables) => {
      return variables.input.demonstrationId === "error";
    },
    error: new Error("Failed to assign demonstration types."),
    maxUsageCount: Infinity,
  },
];
