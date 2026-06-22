export function validateDocumentCanBeDeleted(document: {
  id: string;
  deliverableSubmissionActionId?: string | null;
}): void {
  if (document.deliverableSubmissionActionId) {
    throw new Error(
      `Document with ID ${document.id} cannot be deleted because it is part of a deliverable submission.`
    );
  }
}
