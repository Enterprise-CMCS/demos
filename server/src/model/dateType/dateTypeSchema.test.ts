import { describe, expect, it } from "vitest";
import { Kind, type ScalarTypeDefinitionNode } from "graphql";
import { dateTypeSchema } from "./dateTypeSchema.js";

describe("dateTypeSchema", () => {
  it("defines DateType scalar", () => {
    const scalarDefinition = dateTypeSchema.definitions.find(
      (definition): definition is ScalarTypeDefinitionNode =>
        definition.kind === Kind.SCALAR_TYPE_DEFINITION
    );

    expect(scalarDefinition?.name.value).toBe("DateType");
  });
});
