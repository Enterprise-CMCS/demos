import React from "react";
import { SecondaryButton, TertiaryButton } from "components/button";
import { canRequestExtension } from "components/dialog/deliverable";
import { useDialog } from "components/dialog/DialogContext";
import { DeliverableDetailsManagementDeliverable } from "../DeliverableDetailsManagementPage";

export const DELIVERABLE_BUTTONS_NAME = "deliverable-buttons";
export const REFERENCES_BUTTON_NAME = "button-references";
export const REQUEST_EXTENSION_BUTTON_NAME = "button-request-extension";

export const DeliverableButtons = ({
  deliverable,
}: {
  deliverable: DeliverableDetailsManagementDeliverable;
}) => {
  const { showRequestExtensionDeliverableDialog } = useDialog();

  const handleRequestExtension = () => {
    showRequestExtensionDeliverableDialog({
      id: deliverable.id,
      dueDate: deliverable.dueDate,
      demonstration: { expirationDate: deliverable.demonstration.expirationDate },
    });
  };

  return (
    <div className="flex gap-2" data-testid={DELIVERABLE_BUTTONS_NAME}>
      <TertiaryButton name={REFERENCES_BUTTON_NAME}>References</TertiaryButton>
      <SecondaryButton
        name={REQUEST_EXTENSION_BUTTON_NAME}
        onClick={handleRequestExtension}
        disabled={!canRequestExtension(deliverable.status)}
      >
        Request Extension
      </SecondaryButton>
    </div>
  );
};
