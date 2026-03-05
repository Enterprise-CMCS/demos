import { describe, expect, it } from "vitest";
import { Kind, type DefinitionNode } from "graphql";
import { documentSchema } from "./documentSchema.js";

function findDefinition(
  name: string,
  kind:
    | typeof Kind.OBJECT_TYPE_DEFINITION
    | typeof Kind.INPUT_OBJECT_TYPE_DEFINITION
): DefinitionNode | undefined {
  return documentSchema.definitions.find(
    (definition) =>
      definition.kind === kind &&
      "name" in definition &&
      definition.name?.value === name
  );
}

describe("documentSchema", () => {
  it("defines Document type with key fields", () => {
    const documentType = findDefinition("Document", Kind.OBJECT_TYPE_DEFINITION);
    expect(documentType).toBeDefined();

    if (!documentType || documentType.kind !== Kind.OBJECT_TYPE_DEFINITION) {
      throw new Error("Document type not found.");
    }

    const fieldNames = documentType.fields?.map((field) => field.name.value) ?? [];
    expect(fieldNames).toEqual(
      expect.arrayContaining([
        "id",
        "name",
        "description",
        "s3Path",
        "owner",
        "documentType",
        "application",
        "phaseName",
        "presignedDownloadUrl",
        "createdAt",
        "updatedAt",
      ])
    );
  });

  it("defines upload and update document inputs", () => {
    const uploadInput = findDefinition("UploadDocumentInput", Kind.INPUT_OBJECT_TYPE_DEFINITION);
    const updateInput = findDefinition("UpdateDocumentInput", Kind.INPUT_OBJECT_TYPE_DEFINITION);

    expect(uploadInput).toBeDefined();
    expect(updateInput).toBeDefined();

    if (
      !uploadInput ||
      uploadInput.kind !== Kind.INPUT_OBJECT_TYPE_DEFINITION ||
      !updateInput ||
      updateInput.kind !== Kind.INPUT_OBJECT_TYPE_DEFINITION
    ) {
      throw new Error("Input definitions not found.");
    }

    const uploadInputFieldNames = uploadInput.fields?.map((field) => field.name.value) ?? [];
    const updateInputFieldNames = updateInput.fields?.map((field) => field.name.value) ?? [];

    expect(uploadInputFieldNames).toEqual(
      expect.arrayContaining(["name", "description", "documentType", "applicationId", "phaseName"])
    );
    expect(updateInputFieldNames).toEqual(
      expect.arrayContaining(["name", "description", "documentType", "applicationId", "phaseName"])
    );
  });

  it("defines document mutations and queries", () => {
    const mutation = findDefinition("Mutation", Kind.OBJECT_TYPE_DEFINITION);
    const query = findDefinition("Query", Kind.OBJECT_TYPE_DEFINITION);

    expect(mutation).toBeDefined();
    expect(query).toBeDefined();

    if (
      !mutation ||
      mutation.kind !== Kind.OBJECT_TYPE_DEFINITION ||
      !query ||
      query.kind !== Kind.OBJECT_TYPE_DEFINITION
    ) {
      throw new Error("Mutation/Query definitions not found.");
    }

    const mutationFields = mutation.fields?.map((field) => field.name.value) ?? [];
    const queryFields = query.fields?.map((field) => field.name.value) ?? [];

    expect(mutationFields).toEqual(
      expect.arrayContaining([
        "uploadDocument",
        "updateDocument",
        "deleteDocument",
        "deleteDocuments",
        "triggerUiPath",
        "processBudgetNeutralityNotebookValidation",
      ])
    );
    expect(queryFields).toEqual(expect.arrayContaining(["document", "documentExists"]));
  });
});
