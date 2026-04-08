import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { useDialog } from "components/dialog/DialogContext";
import { Deliverable } from "pages/DeliverablesPage";
import { AddDeliverableSlotDemonstration } from "components/dialog/deliverable/AddDeliverableSlotDialog";
import { DemonstrationDeliverableTable } from "components/table/tables/DemonstrationDeliverableTable";

export const ADD_DELIVERABLE_SLOT_BUTTON_NAME = "button-add-deliverable-slot";

export const DeliverablesTab = ({
  parentDemonstration,
  deliverables,
}: {
  parentDemonstration: AddDeliverableSlotDemonstration;
  deliverables: Deliverable[];
}) => {
  const { showAddDeliverableSlotDialog } = useDialog();

  return (
    <div className="flex flex-col gap-[24px]">
      <TabHeader title="Deliverables Management">
        <IconButton
          icon={<AddNewIcon />}
          name={ADD_DELIVERABLE_SLOT_BUTTON_NAME}
          size="small"
          onClick={() => showAddDeliverableSlotDialog(parentDemonstration)}
        >
          Add Deliverable Slot(s)
        </IconButton>
      </TabHeader>
      <DemonstrationDeliverableTable deliverables={deliverables} />
    </div>
  );
};
