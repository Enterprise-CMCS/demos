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

  it.each(["Submitted", "Under CMS Review", "Accepted", "Approved", "Received and Filed"] as const)(
    "should throw an error when the deliverable status is %s",
    (deliverableStatus) => {
      const document = {
        id: "doc3",
        deliverableSubmissionActionId: null,
        deliverableStatus,
      };
      expect(() => validateDocumentCanBeDeleted(document)).toThrow(
        `Document with ID doc3 cannot be deleted because its deliverable has been submitted.`
      );
    }
  );

  it.each(["Upcoming", "Past Due"] as const)(
    "should not throw an error when the deliverable status is %s",
    (deliverableStatus) => {
      const document = {
        id: "doc4",
        deliverableSubmissionActionId: null,
        deliverableStatus,
      };
      expect(() => validateDocumentCanBeDeleted(document)).not.toThrow();
    }
  );

  it("should not throw an error when the document is not attached to a deliverable", () => {
    const document = {
      id: "doc5",
      deliverableSubmissionActionId: null,
      deliverableStatus: null,
    };
    expect(() => validateDocumentCanBeDeleted(document)).not.toThrow();
  });
});
