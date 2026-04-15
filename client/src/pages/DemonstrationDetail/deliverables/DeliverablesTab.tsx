import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { useDialog } from "components/dialog/DialogContext";
import { AddDeliverableSlotDemonstration } from "components/dialog/deliverable/AddDeliverableSlotDialog";
import { DemonstrationDeliverableTable } from "components/table/tables/DemonstrationDeliverableTable";
import { getCurrentUser } from "components/user/UserContext";
import {
  DELIVERABLES_PAGE_QUERY,
  type DeliverableTableViewMode,
  type DeliverablesQueryResult,
} from "components/table/tables/DeliverableTable";
import { useQuery } from "@apollo/client";

export const ADD_DELIVERABLE_SLOT_BUTTON_NAME = "button-add-deliverable-slot";

export const DeliverablesTab = ({
  parentDemonstration,
}: {
  parentDemonstration: AddDeliverableSlotDemonstration;
}) => {
  const { showAddDeliverableSlotDialog } = useDialog();
  const rawPersonType = getCurrentUser().currentUser?.person.personType;
  const viewMode = rawPersonType as DeliverableTableViewMode;
  const { data, loading, error } = useQuery<DeliverablesQueryResult>(DELIVERABLES_PAGE_QUERY);
  const deliverables = data?.deliverables.filter(
    (deliverable) => deliverable.demonstration.id === parentDemonstration.id
  ) ?? [];

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
      {loading && <div className="p-4">Loading deliverables...</div>}
      {error && (
        <div className="p-4 text-red-500">Error loading deliverables.</div>
      )}
      {!loading && !error && (
        <DemonstrationDeliverableTable
          deliverables={deliverables}
          viewMode={viewMode}
        />
      )}
    </div>
  );
};
