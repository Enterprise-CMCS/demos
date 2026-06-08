import { DeliverableStatus } from "../../constants";

// A document attached to a deliverable can only be deleted before that deliverable
// has been submitted. Once it is Submitted, Under CMS Review, or in any final status,
// its files are locked from deletion for every user. (Documents that were part of a
// submission are additionally pinned via deliverableSubmissionActionId, but documents
// added after submission are never stamped, so the status check is what guards them.)
export const DOCUMENT_DELETION_LOCKED_DELIVERABLE_STATUSES: ReadonlySet<DeliverableStatus> =
  new Set(["Submitted", "Under CMS Review", "Accepted", "Approved", "Received and Filed"]);

export function validateDocumentCanBeDeleted(document: {
  id: string;
  deliverableSubmissionActionId?: string | null;
  deliverableStatus?: DeliverableStatus | null;
}): void {
  if (document.deliverableSubmissionActionId) {
    throw new Error(
      `Document with ID ${document.id} cannot be deleted because it is part of a deliverable submission.`
    );
  }

  if (
    document.deliverableStatus &&
    DOCUMENT_DELETION_LOCKED_DELIVERABLE_STATUSES.has(document.deliverableStatus)
  ) {
    throw new Error(
      `Document with ID ${document.id} cannot be deleted because its deliverable has been submitted.`
    );
  }
}
