import type { ContextUser } from "../../auth";

const STATE_UPDATABLE_DELIVERABLE_STATUSES = new Set(["Upcoming", "Past Due"]);

export function validateDocumentCanBeUpdated(document: {
  id: string;
  ownerUserId: string;
  deliverableIsCmsAttachedFile?: boolean | null;
  deliverableSubmissionActionId?: string | null;
  deliverable?: { statusId: string } | null;
}, user?: ContextUser): void {
  if (user?.personTypeId !== "demos-state-user") {
    return;
  }

  if (document.ownerUserId !== user.id) {
    throw new Error(`Document with ID ${document.id} cannot be updated by this user.`);
  }

  if (document.deliverableIsCmsAttachedFile !== false) {
    throw new Error(`Document with ID ${document.id} is not a state deliverable file.`);
  }

  if (document.deliverableSubmissionActionId) {
    throw new Error(
      `Document with ID ${document.id} cannot be updated because it is part of a deliverable submission.`
    );
  }

  if (
    !document.deliverable ||
    !STATE_UPDATABLE_DELIVERABLE_STATUSES.has(document.deliverable.statusId)
  ) {
    throw new Error(
      `Document with ID ${document.id} cannot be updated because its deliverable has been submitted.`
    );
  }
}
