import { describe, expect, it } from "vitest";
import type { ContextUser } from "../../auth";
import { validateDocumentCanBeUpdated } from "./validateDocumentCanBeUpdated";

describe("validateDocumentCanBeUpdated", () => {
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

  it("should not apply state-user update restrictions to CMS users", () => {
    const document = {
      id: "doc1",
      ownerUserId: "another-user",
      deliverableIsCmsAttachedFile: true,
      deliverableSubmissionActionId: "action1",
      deliverable: { statusId: "Submitted" },
    };

    expect(() => validateDocumentCanBeUpdated(document, cmsUser)).not.toThrow();
  });

  it.each(["Upcoming", "Past Due"])(
    "should allow state users to update their own state files before submission when status is %s",
    (statusId) => {
      const document = {
        id: "doc2",
        ownerUserId: stateUser.id,
        deliverableIsCmsAttachedFile: false,
        deliverableSubmissionActionId: null,
        deliverable: { statusId },
      };

      expect(() => validateDocumentCanBeUpdated(document, stateUser)).not.toThrow();
    }
  );

  it("should prevent state users from updating files they do not own", () => {
    const document = {
      id: "doc3",
      ownerUserId: "another-user",
      deliverableIsCmsAttachedFile: false,
      deliverableSubmissionActionId: null,
      deliverable: { statusId: "Upcoming" },
    };

    expect(() => validateDocumentCanBeUpdated(document, stateUser)).toThrow(
      `Document with ID doc3 cannot be updated by this user.`
    );
  });

  it("should prevent state users from updating CMS deliverable files", () => {
    const document = {
      id: "doc4",
      ownerUserId: stateUser.id,
      deliverableIsCmsAttachedFile: true,
      deliverableSubmissionActionId: null,
      deliverable: { statusId: "Upcoming" },
    };

    expect(() => validateDocumentCanBeUpdated(document, stateUser)).toThrow(
      `Document with ID doc4 is not a state deliverable file.`
    );
  });

  it("should prevent state users from updating submitted files", () => {
    const document = {
      id: "doc5",
      ownerUserId: stateUser.id,
      deliverableIsCmsAttachedFile: false,
      deliverableSubmissionActionId: "action1",
      deliverable: { statusId: "Submitted" },
    };

    expect(() => validateDocumentCanBeUpdated(document, stateUser)).toThrow(
      `Document with ID doc5 cannot be updated because it is part of a deliverable submission.`
    );
  });
});
