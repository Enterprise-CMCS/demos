import React from "react";

import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { useDialog } from "components/dialog/DialogContext";

const ADD_DELIVERABLE_SLOT_BUTTON_NAME = "button-add-deliverable-slot";

export const DeliverablesTab = ({ demonstrationTypes }: { demonstrationTypes: string[] }) => {
  const { showAddDeliverableSlotDialog } = useDialog();

  return (
    <>
      <TabHeader title="Deliverables">
        <IconButton
          icon={<AddNewIcon />}
          name={ADD_DELIVERABLE_SLOT_BUTTON_NAME}
          size="small"
          onClick={() => showAddDeliverableSlotDialog(demonstrationTypes)}
        >
          Add Deliverable Slot(s)
        </IconButton>
      </TabHeader>
    </>
  );
};
