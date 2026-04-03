import React from "react";

import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { useDialog } from "components/dialog/DialogContext";
import { AddDeliverableSlotDemonstration } from "components/dialog/deliverable/AddDeliverableSlotDialog";

export const ADD_DELIVERABLE_SLOT_BUTTON_NAME = "button-add-deliverable-slot";

export const DeliverablesTab = ({
  parentDemonstration,
}: {
  parentDemonstration: AddDeliverableSlotDemonstration;
}) => {
  const { showAddDeliverableSlotDialog } = useDialog();

  return (
    <>
      <TabHeader title="Deliverables">
        <IconButton
          icon={<AddNewIcon />}
          name={ADD_DELIVERABLE_SLOT_BUTTON_NAME}
          size="small"
          onClick={() => showAddDeliverableSlotDialog(parentDemonstration)}
        >
          Add Deliverable Slot(s)
        </IconButton>
      </TabHeader>
    </>
  );
};
