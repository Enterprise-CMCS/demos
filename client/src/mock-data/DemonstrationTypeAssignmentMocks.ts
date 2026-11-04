import { MockedResponse } from "@apollo/client/testing";
import { ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION } from "components/dialog/DemonstrationTypes/ApplyDemonstrationTypesDialog";

import { DemonstrationTypeAssignment, LocalDate, SetDemonstrationTypesInput } from "demos-server";

export type MockDemonstrationTypeAssignment = Pick<
  DemonstrationTypeAssignment,
  "demonstrationTypeName" | "effectivePlainDate" | "expirationPlainDate"
>;

export const MOCK_DEMONSTRATION_TYPE_ASSIGNMENTS: MockDemonstrationTypeAssignment[] = [
  {
    demonstrationTypeName: "Aggregate Cap",
    effectivePlainDate: "2025-01-01" as LocalDate,
    expirationPlainDate: "2025-12-31" as LocalDate,
  },
  {
    demonstrationTypeName: "Annual Limits",
    effectivePlainDate: "2025-02-01" as LocalDate,
    expirationPlainDate: "2025-11-30" as LocalDate,
  },
  {
    demonstrationTypeName: "Basic Health Plan (BHP)",
    effectivePlainDate: "2025-03-01" as LocalDate,
    expirationPlainDate: "2025-10-31" as LocalDate,
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
          id: variables.input.demonstrationId,
          demonstrationTypes: variables.input.demonstrationTypes
            .filter((dt) => dt.demonstrationTypeDates !== null)
            .map((dt) => ({
              demonstrationTypeName: dt.demonstrationTypeName,
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
