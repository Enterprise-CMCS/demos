import React, { useState } from "react";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { CMSOwnerField } from "./fields/CMSOwnerField";
import { DeliverableNameField } from "./fields/DeliverableNameField";
import { DeliverableTypeField } from "./fields/DeliverableTypeField";

export const ADD_DELIVERABLE_SLOT_DIALOG_TITLE = "Add New Deliverable Slot(s)";
export const ADD_DELIVERABLE_SLOT_DIALOG_NAME = "add-deliverable-slot-dialog";
export const ADD_DELIVERABLE_SLOT_SAVE_BUTTON_NAME = "button-add-deliverable-slot-confirm";

interface AddDeliverableSlotFormData {
  deliverableName: string;
  cmsOwnerId: string;
  deliverableType: string;
}

const INITIAL_FORM_DATA: AddDeliverableSlotFormData = {
  deliverableName: "",
  cmsOwnerId: "",
  deliverableType: "",
};

const checkFormIsValid = (data: AddDeliverableSlotFormData): boolean =>
  data.deliverableName.trim().length > 0 &&
  data.cmsOwnerId.length > 0 &&
  data.deliverableType.length > 0;

const checkFormHasChanges = (data: AddDeliverableSlotFormData): boolean =>
  data.deliverableName !== INITIAL_FORM_DATA.deliverableName ||
  data.cmsOwnerId !== INITIAL_FORM_DATA.cmsOwnerId ||
  data.deliverableType !== INITIAL_FORM_DATA.deliverableType;

export const AddDeliverableSlotDialog = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState<AddDeliverableSlotFormData>(INITIAL_FORM_DATA);

  const formIsValid = checkFormIsValid(formData);
  const formHasChanges = checkFormHasChanges(formData);

  return (
    <BaseDialog
      name={ADD_DELIVERABLE_SLOT_DIALOG_NAME}
      title={ADD_DELIVERABLE_SLOT_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={formHasChanges}
      actionButton={
        <Button
          name={ADD_DELIVERABLE_SLOT_SAVE_BUTTON_NAME}
          onClick={onClose}
          disabled={!formIsValid}
        >
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-md">
        <DeliverableNameField
          value={formData.deliverableName}
          onChange={(deliverableName) => setFormData((prev) => ({ ...prev, deliverableName }))}
        />
        <CMSOwnerField
          value={formData.cmsOwnerId}
          onSelect={(cmsOwnerId) => setFormData((prev) => ({ ...prev, cmsOwnerId }))}
        />
        <DeliverableTypeField
          value={formData.deliverableType}
          onSelect={(deliverableType) => setFormData((prev) => ({ ...prev, deliverableType }))}
        />
      </div>
    </BaseDialog>
  );
};
