import React from "react";
import { SecondaryButton } from "components/button";
import { canRequestExtension } from "components/dialog/deliverable";
import { useDialog } from "components/dialog/DialogContext";
import { getCurrentUser } from "components/user/UserContext";
import { DeliverableStatus } from "demos-server";
import { DeliverableDetailsManagementDeliverable } from "../DeliverableDetailsManagementPage";

export const DELIVERABLE_BUTTONS_NAME = "deliverable-buttons";
export const REQUEST_EXTENSION_BUTTON_NAME = "button-request-extension";
export const REQUEST_RESUBMISSION_BUTTON_NAME = "button-request-resubmission";

export const canRequestResubmission = (status: DeliverableStatus): boolean =>
  status === "Submitted" || status === "Under CMS Review";

export const DeliverableButtons = ({
  deliverable,
  onRequestResubmission,
}: {
  deliverable: DeliverableDetailsManagementDeliverable;
  onRequestResubmission: (deliverable: DeliverableDetailsManagementDeliverable) => void;
}) => {
  const { showRequestExtensionDeliverableDialog } = useDialog();
  const { currentUser } = getCurrentUser();
  const userPersonType = currentUser?.person.personType;

  const handleRequestExtension = () => {
    showRequestExtensionDeliverableDialog({
      id: deliverable.id,
      dueDate: deliverable.dueDate,
      demonstration: { expirationDate: deliverable.demonstration.expirationDate },
    });
  };

  return (
    <div className="flex gap-2" data-testid={DELIVERABLE_BUTTONS_NAME}>
      {userPersonType === "demos-state-user" ? (
        <SecondaryButton
          name={REQUEST_EXTENSION_BUTTON_NAME}
          onClick={handleRequestExtension}
          disabled={!canRequestExtension(deliverable.status)}
        >
          Request Extension
        </SecondaryButton>
      ) : null}
      {userPersonType === "demos-cms-user" ? (
        <SecondaryButton
          name={REQUEST_RESUBMISSION_BUTTON_NAME}
          onClick={() => onRequestResubmission(deliverable)}
          disabled={!canRequestResubmission(deliverable.status)}
        >
          Request Resubmission
        </SecondaryButton>
      ) : null}
    </div>
  );
};
