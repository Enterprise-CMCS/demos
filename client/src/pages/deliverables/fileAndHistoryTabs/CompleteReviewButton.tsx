import { Button } from "components/button";
import { hasOpenRenewalRequest } from "components/dialog/deliverable/RequestRenewalDeliverableDialog";
import { useDialog } from "components/dialog/DialogContext";
import { Deliverable, DeliverableExtension, DeliverableStatus } from "demos-server";
import React from "react";

const COMPLETE_REVIEW_ELIGIBLE_STATUSES: ReadonlySet<DeliverableStatus> = new Set([
  "Under CMS Review",
]);

export const COMPLETE_REVIEW_BUTTON = {
  name: "button-actions-complete-review",
  ineligibleStatusTooltip: "Inelegible Status for Finalization",
  activeRenewalRequestTooltip: "Active Renewal Request",
  unsubmittedFilesTooltip: "Unsubmitted Files",
  enabledTooltip: "Complete Review",
  label: "Complete Review",
};

export const CompleteReviewButton = ({
  deliverable,
}: {
  deliverable: Pick<Deliverable, "id" | "status"> & {
    renewalRequests: Pick<DeliverableExtension, "status">[];
    stateDocuments: {
      deliverableSubmissionAction: object | null;
    }[];
  };
}) => {
  const { showCompleteReviewDeliverableDialog } = useDialog();

  const isInElegibleStatus = COMPLETE_REVIEW_ELIGIBLE_STATUSES.has(deliverable.status);
  const hasNoOpenRenewalRequest = !hasOpenRenewalRequest(deliverable.renewalRequests);
  const allDocumentsSubmitted = deliverable.stateDocuments.every(
    (doc) => doc.deliverableSubmissionAction !== null
  );

  const toolTip = !isInElegibleStatus
    ? COMPLETE_REVIEW_BUTTON.ineligibleStatusTooltip
    : !hasNoOpenRenewalRequest
      ? COMPLETE_REVIEW_BUTTON.activeRenewalRequestTooltip
      : !allDocumentsSubmitted
        ? COMPLETE_REVIEW_BUTTON.unsubmittedFilesTooltip
        : COMPLETE_REVIEW_BUTTON.enabledTooltip;

  return (
    <Button
      disabled={!isInElegibleStatus || !hasNoOpenRenewalRequest || !allDocumentsSubmitted}
      onClick={() => showCompleteReviewDeliverableDialog({ id: deliverable.id })}
      size="large"
      name={COMPLETE_REVIEW_BUTTON.name}
      tooltip={toolTip}
    >
      Complete Review
    </Button>
  );
};
