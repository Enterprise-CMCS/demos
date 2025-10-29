import { describe, it, expect } from "vitest";
import {
  SET_APPLICATION_DATE_MUTATION,
  buildSetApplicationDateVariables,
  SetApplicationDateMutationVariables,
} from "./applicationDateQueries";
import { SetApplicationDateInput } from "demos-server";

const TEST_SET_PHASE_DATE_INPUT: SetApplicationDateInput = {
  applicationId: "test-application-123",
  dateType: "Concept Start Date",
  dateValue: new Date(Date.parse("2025-01-15T10:30:00.000Z")),
};

describe("SET_APPLICATION_DATE_MUTATION", () => {
  it("should define a mutation operation", () => {
    const operationDefinition = SET_APPLICATION_DATE_MUTATION.definitions[0];

    expect(operationDefinition?.kind).toBe("OperationDefinition");
    if (operationDefinition?.kind !== "OperationDefinition") return;

    expect(operationDefinition.operation).toBe("mutation");
    expect(operationDefinition.name?.value).toBe("SetApplicationDate");
  });
});

describe("buildSetApplicationDateVariables", () => {
  it("should format variables correctly for the mutation", () => {
    const variables = buildSetApplicationDateVariables(TEST_SET_PHASE_DATE_INPUT);
    const expected: SetApplicationDateMutationVariables = {
      input: {
        applicationId: "test-application-123",
        dateType: "Concept Start Date",
        dateValue: "2025-01-15T10:30:00.000Z",
      },
    };

    expect(variables).toEqual(expected);
  });

  it("should preserve exact date precision", () => {
    const preciseDate = new Date("2025-02-14T14:30:45.123Z");
    const input: SetApplicationDateInput = {
      ...TEST_SET_PHASE_DATE_INPUT,
      dateValue: preciseDate,
    };

    const variables = buildSetApplicationDateVariables(input);

    expect(variables.input.dateValue).toBe("2025-02-14T14:30:45.123Z");
  });

  it("should support multiple date types", () => {
    const dateTypes = [
      "Completeness Start Date",
      "Completeness Completion Date",
      "Federal Comment Period Start Date",
      "Federal Comment Period End Date",
    ] as const;

    dateTypes.forEach((dateType) => {
      const input: SetApplicationDateInput = {
        ...TEST_SET_PHASE_DATE_INPUT,
        dateType,
      };

      const variables = buildSetApplicationDateVariables(input);
      expect(variables.input.dateType).toBe(dateType);
    });
  });
});
