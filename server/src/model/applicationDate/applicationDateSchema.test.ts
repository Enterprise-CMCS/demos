import { describe, expect, it } from "vitest";
import { Kind, type DefinitionNode } from "graphql";
import { applicationDateSchema } from "./applicationDateSchema.js";

function findDefinition(
  name: string,
  kind: typeof Kind.OBJECT_TYPE_DEFINITION | typeof Kind.INPUT_OBJECT_TYPE_DEFINITION
): DefinitionNode | undefined {
  return applicationDateSchema.definitions.find(
    (definition) =>
      definition.kind === kind &&
      "name" in definition &&
      definition.name?.value === name
  );
}

describe("applicationDateSchema", () => {
  it("defines key ApplicationDate object and input types", () => {
    expect(findDefinition("ApplicationDate", Kind.OBJECT_TYPE_DEFINITION)).toBeDefined();
    expect(findDefinition("SetApplicationDateInput", Kind.INPUT_OBJECT_TYPE_DEFINITION)).toBeDefined();
    expect(findDefinition("SetApplicationDatesInput", Kind.INPUT_OBJECT_TYPE_DEFINITION)).toBeDefined();
  });
});
