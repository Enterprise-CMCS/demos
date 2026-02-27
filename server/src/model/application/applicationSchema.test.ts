import { describe, expect, it } from "vitest";
import { Kind, type DefinitionNode } from "graphql";
import { applicationSchema } from "./applicationSchema.js";

function findDefinition(
  name: string,
  kind: typeof Kind.UNION_TYPE_DEFINITION | typeof Kind.INPUT_OBJECT_TYPE_DEFINITION
): DefinitionNode | undefined {
  return applicationSchema.definitions.find(
    (definition) =>
      definition.kind === kind &&
      "name" in definition &&
      definition.name?.value === name
  );
}

describe("applicationSchema", () => {
  it("defines the Application union and clearance input", () => {
    expect(findDefinition("Application", Kind.UNION_TYPE_DEFINITION)).toBeDefined();
    expect(
      findDefinition("SetApplicationClearanceLevelInput", Kind.INPUT_OBJECT_TYPE_DEFINITION)
    ).toBeDefined();
  });
});
