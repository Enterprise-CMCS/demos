import React from "react";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";

export const ADD_DELIVERABLE_SLOT_DIALOG_TITLE = "Add New Deliverable Slot(s)";
export const ADD_DELIVERABLE_SLOT_DIALOG_NAME = "add-deliverable-slot-dialog";
export const ADD_DELIVERABLE_SLOT_SAVE_BUTTON_NAME = "button-add-deliverable-slot-confirm";

export const AddDeliverableSlotDialog = ({ onClose }: { onClose: () => void }) => {
  return (
    <BaseDialog
      name={ADD_DELIVERABLE_SLOT_DIALOG_NAME}
      title={ADD_DELIVERABLE_SLOT_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={false}
      actionButton={
        <Button name={ADD_DELIVERABLE_SLOT_SAVE_BUTTON_NAME} onClick={onClose}>
          Save
        </Button>
      }
    >
      <p>TODO fields go here</p>
    </BaseDialog>
  );
};
