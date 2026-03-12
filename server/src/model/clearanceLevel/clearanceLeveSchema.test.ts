import { describe, expect, it } from "vitest";
import { Kind, type ScalarTypeDefinitionNode } from "graphql";
import { clearanceLevelSchema } from "./clearanceLeveSchema.js";

describe("clearanceLeveSchema", () => {
  it("defines ClearanceLevel scalar", () => {
    const scalarDefinition = clearanceLevelSchema.definitions.find(
      (definition): definition is ScalarTypeDefinitionNode =>
        definition.kind === Kind.SCALAR_TYPE_DEFINITION
    );

    expect(scalarDefinition?.name.value).toBe("ClearanceLevel");
  });
});
