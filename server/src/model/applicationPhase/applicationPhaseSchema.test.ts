import { describe, expect, it } from "vitest";
import { Kind, type DefinitionNode } from "graphql";
import { applicationPhaseSchema } from "./applicationPhaseSchema.js";

function findDefinition(
  name: string,
  kind: typeof Kind.OBJECT_TYPE_DEFINITION | typeof Kind.INPUT_OBJECT_TYPE_DEFINITION
): DefinitionNode | undefined {
  return applicationPhaseSchema.definitions.find(
    (definition) =>
      definition.kind === kind &&
      "name" in definition &&
      definition.name?.value === name
  );
}

describe("applicationPhaseSchema", () => {
  it("defines key ApplicationPhase object and input types", () => {
    expect(findDefinition("ApplicationPhase", Kind.OBJECT_TYPE_DEFINITION)).toBeDefined();
    expect(findDefinition("CompletePhaseInput", Kind.INPUT_OBJECT_TYPE_DEFINITION)).toBeDefined();
  });
});
