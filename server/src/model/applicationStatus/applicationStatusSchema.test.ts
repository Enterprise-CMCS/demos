import { describe, expect, it } from "vitest";
import { Kind, type ScalarTypeDefinitionNode } from "graphql";
import { applicationStatusSchema } from "./applicationStatusSchema.js";

describe("applicationStatusSchema", () => {
  it("defines ApplicationStatus scalar", () => {
    const scalarDefinition = applicationStatusSchema.definitions.find(
      (definition): definition is ScalarTypeDefinitionNode =>
        definition.kind === Kind.SCALAR_TYPE_DEFINITION
    );

    expect(scalarDefinition?.name.value).toBe("ApplicationStatus");
  });
});
