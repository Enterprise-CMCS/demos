import { describe, expect, it } from "vitest";
import type { ContextUser } from "../../auth";
import { validateDocumentCanBeDeleted } from "./validateDocumentCanBeDeleted";

describe("validateDocumentCanBeDeleted", () => {
  const stateUser: ContextUser = {
    id: "state-user-1",
    cognitoSubject: "state-subject",
    personTypeId: "demos-state-user",
    permissions: [],
  };

  const cmsUser: ContextUser = {
    id: "cms-user-1",
    cognitoSubject: "cms-subject",
    personTypeId: "demos-cms-user",
    permissions: [],
  };

  it("should throw an error if the document is part of a deliverable submission", () => {
    const document = {
      id: "doc1",
      ownerUserId: "user1",
      deliverableSubmissionActionId: "action1",
    };
    expect(() => validateDocumentCanBeDeleted(document)).toThrow(
      `Document with ID doc1 cannot be deleted because it is part of a deliverable submission.`
    );
  });

  it("should not throw an error if the document is not part of a deliverable submission", () => {
    const document = {
      id: "doc2",
      ownerUserId: "user1",
      deliverableSubmissionActionId: null,
    };
    expect(() => validateDocumentCanBeDeleted(document)).not.toThrow();
  });

  it("should not apply state-user delete restrictions to CMS users", () => {
    const document = {
      id: "doc3",
      ownerUserId: "another-user",
      deliverableIsCmsAttachedFile: true,
      deliverableSubmissionActionId: null,
      deliverable: { statusId: "Submitted" },
    };

    expect(() => validateDocumentCanBeDeleted(document, cmsUser)).not.toThrow();
  });

  it.each(["Upcoming", "Past Due"])(
    "should allow state users to delete their own state files before submission when status is %s",
    (statusId) => {
      const document = {
        id: "doc4",
        ownerUserId: stateUser.id,
        deliverableIsCmsAttachedFile: false,
        deliverableSubmissionActionId: null,
        deliverable: { statusId },
      };

      expect(() => validateDocumentCanBeDeleted(document, stateUser)).not.toThrow();
    }
  );

  it("should prevent state users from deleting files they do not own", () => {
    const document = {
      id: "doc5",
      ownerUserId: "another-user",
      deliverableIsCmsAttachedFile: false,
      deliverableSubmissionActionId: null,
      deliverable: { statusId: "Upcoming" },
    };

    expect(() => validateDocumentCanBeDeleted(document, stateUser)).toThrow(
      `Document with ID doc5 cannot be deleted by this user.`
    );
  });

  it("should prevent state users from deleting CMS deliverable files", () => {
    const document = {
      id: "doc6",
      ownerUserId: stateUser.id,
      deliverableIsCmsAttachedFile: true,
      deliverableSubmissionActionId: null,
      deliverable: { statusId: "Upcoming" },
    };

    expect(() => validateDocumentCanBeDeleted(document, stateUser)).toThrow(
      `Document with ID doc6 is not a state deliverable file.`
    );
  });

  it("should prevent state users from deleting files after submission", () => {
    const document = {
      id: "doc7",
      ownerUserId: stateUser.id,
      deliverableIsCmsAttachedFile: false,
      deliverableSubmissionActionId: null,
      deliverable: { statusId: "Submitted" },
    };

    expect(() => validateDocumentCanBeDeleted(document, stateUser)).toThrow(
      `Document with ID doc7 cannot be deleted because its deliverable has been submitted.`
    );
  });
});
