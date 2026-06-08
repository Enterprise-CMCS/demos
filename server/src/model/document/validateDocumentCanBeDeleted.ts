import { DeliverableStatus } from "../../constants";


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
