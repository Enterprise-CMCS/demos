import React from "react";
import { PersonType } from "demos-server";
import { SecondaryButton } from "components/button";
import { canRequestRenewal } from "components/dialog/deliverable";
import { useDialog } from "components/dialog/DialogContext";
import { getCurrentUser } from "components/user/UserContext";
import { DeliverableDetailsManagementDeliverable } from "../DeliverableDetailsManagementPage";

export const DELIVERABLE_BUTTONS_NAME = "deliverable-buttons";
export const REQUEST_RENEWAL_BUTTON_NAME = "button-request-renewal";

const REQUEST_RENEWAL_PERSON_TYPES: ReadonlySet<PersonType> = new Set([
  "demos-admin",
  "demos-state-user",
]);

export const DeliverableButtons = ({
  deliverable,
}: {
  deliverable: DeliverableDetailsManagementDeliverable;
}) => {
  const { showRequestRenewalDeliverableDialog } = useDialog();
  const { currentUser } = getCurrentUser();
  const userPersonType = currentUser.person.personType;
  const canSeeRequestRenewal = REQUEST_RENEWAL_PERSON_TYPES.has(userPersonType);

  const handleRequestRenewal = () => {
    showRequestRenewalDeliverableDialog({
      id: deliverable.id,
      dueDate: deliverable.dueDate,
    });
  };

  return (
    <div className="flex gap-2" data-testid={DELIVERABLE_BUTTONS_NAME}>
      {canSeeRequestRenewal ? (
        <SecondaryButton
          name={REQUEST_RENEWAL_BUTTON_NAME}
          onClick={handleRequestRenewal}
          disabled={!canRequestRenewal(deliverable.status, deliverable.renewalRequests)}
        >
          Request Renewal
        </SecondaryButton>
      ) : null}
    </div>
  );
};
