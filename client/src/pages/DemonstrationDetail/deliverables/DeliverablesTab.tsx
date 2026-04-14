import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { useDialog } from "components/dialog/DialogContext";
import type { GenericDeliverableTableRow } from "pages/DeliverablesPage";
import { AddDeliverableSlotDemonstration } from "components/dialog/deliverable/AddDeliverableSlotDialog";
import { DemonstrationDeliverableTable } from "components/table/tables/DemonstrationDeliverableTable";
import { getCurrentUserOrUndefined } from "components/user/UserContext";
import type { DeliverableTableViewMode } from "components/table/tables/DeliverableTable";

export const ADD_DELIVERABLE_SLOT_BUTTON_NAME = "button-add-deliverable-slot";

export const DeliverablesTab = ({
  parentDemonstration,
  deliverables,
}: {
  parentDemonstration: AddDeliverableSlotDemonstration;
  deliverables: GenericDeliverableTableRow[];
}) => {
  const { showAddDeliverableSlotDialog } = useDialog();
  const rawPersonType = getCurrentUserOrUndefined()?.currentUser?.person.personType;
  const viewMode = (rawPersonType ?? "demos-cms-user") as DeliverableTableViewMode;

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
      <DemonstrationDeliverableTable
        deliverables={deliverables}
        viewMode={viewMode}
      />
    </div>
  );
};
