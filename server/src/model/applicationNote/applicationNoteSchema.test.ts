import { describe, expect, it } from "vitest";
import { Kind, type DefinitionNode } from "graphql";
import { applicationNoteSchema } from "./applicationNoteSchema.js";

function findDefinition(
  name: string,
  kind: typeof Kind.OBJECT_TYPE_DEFINITION | typeof Kind.INPUT_OBJECT_TYPE_DEFINITION
): DefinitionNode | undefined {
  return applicationNoteSchema.definitions.find(
    (definition) =>
      definition.kind === kind &&
      "name" in definition &&
      definition.name?.value === name
  );
}

describe("applicationNoteSchema", () => {
  it("defines key ApplicationNote object and input types", () => {
    expect(findDefinition("ApplicationNote", Kind.OBJECT_TYPE_DEFINITION)).toBeDefined();
    expect(findDefinition("ApplicationNoteInput", Kind.INPUT_OBJECT_TYPE_DEFINITION)).toBeDefined();
    expect(findDefinition("SetApplicationNotesInput", Kind.INPUT_OBJECT_TYPE_DEFINITION)).toBeDefined();
  });
});
