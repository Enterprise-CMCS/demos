import { describe, expect, it } from "vitest";
import { Kind, type DefinitionNode } from "graphql";
import { amendmentSchema } from "./amendmentSchema.js";

function findDefinition(
  name: string,
  kind: typeof Kind.OBJECT_TYPE_DEFINITION | typeof Kind.INPUT_OBJECT_TYPE_DEFINITION
): DefinitionNode | undefined {
  return amendmentSchema.definitions.find(
    (definition) =>
      definition.kind === kind &&
      "name" in definition &&
      definition.name?.value === name
  );
}

describe("amendmentSchema", () => {
  it("defines key Amendment object and input types", () => {
    expect(findDefinition("Amendment", Kind.OBJECT_TYPE_DEFINITION)).toBeDefined();
    expect(findDefinition("CreateAmendmentInput", Kind.INPUT_OBJECT_TYPE_DEFINITION)).toBeDefined();
    expect(findDefinition("UpdateAmendmentInput", Kind.INPUT_OBJECT_TYPE_DEFINITION)).toBeDefined();
  });
});
