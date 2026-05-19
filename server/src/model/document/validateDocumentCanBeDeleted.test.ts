import { describe, expect, it } from "vitest";
import { validateDocumentCanBeDeleted } from "./validateDocumentCanBeDeleted";

describe("validateDocumentCanBeDeleted", () => {
  it("should throw an error if the document is part of a deliverable submission", () => {
    const document = {
      id: "doc1",
      deliverableSubmissionActionId: "action1",
    };
    expect(() => validateDocumentCanBeDeleted(document)).toThrow(
      `Document with ID doc1 cannot be deleted because it is part of a deliverable submission.`
    );
  });

  it("should not throw an error if the document is not part of a deliverable submission", () => {
    const document = {
      id: "doc2",
      deliverableSubmissionActionId: null,
    };
    expect(() => validateDocumentCanBeDeleted(document)).not.toThrow();
  });
});
