import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { useDialog } from "components/dialog/DialogContext";
import { AddDeliverableSlotDemonstration } from "components/dialog/deliverable/AddDeliverableSlotDialog";
import { DemonstrationDeliverableTable } from "components/table/tables/DemonstrationDeliverableTable";
import { getCurrentUser } from "components/user/UserContext";
import type { UserType } from "demos-server";
import {
  DELIVERABLES_PAGE_QUERY,
  STATE_USER_DELIVERABLES_PAGE_QUERY,
  type DeliverablesQueryResult,
  type StateUserDeliverablesQueryResult,
} from "components/table/tables/DeliverableTable";
import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

export const ADD_DELIVERABLE_SLOT_BUTTON_NAME = "button-add-deliverable-slot";
const STATE_POINT_OF_CONTACT_ROLE = "State Point of Contact";

type DeliverablesTabQueryResult = Partial<
  DeliverablesQueryResult & StateUserDeliverablesQueryResult
>;

const getStateUserDemonstrationDeliverables = (
  data: DeliverablesTabQueryResult | undefined,
  demonstrationId: string
): DeliverablesQueryResult["deliverables"] => {
  const deliverables =
    data?.currentUser?.person.roles
      .filter(
        (roleAssignment) =>
          roleAssignment.role === STATE_POINT_OF_CONTACT_ROLE &&
          roleAssignment.demonstration.id === demonstrationId
      )
      .flatMap((roleAssignment) => roleAssignment.demonstration.deliverables) ?? [];

  return Array.from(
    new Map(deliverables.map((deliverable) => [deliverable.id, deliverable])).values()
  );
};

export const DeliverablesTab = ({
  parentDemonstration,
}: {
  parentDemonstration: AddDeliverableSlotDemonstration;
}) => {
  const { showAddDeliverableSlotDialog } = useDialog();
  const rawPersonType = getCurrentUser().currentUser?.person.personType;
  const viewMode = rawPersonType as UserType;
  const isStateUser = rawPersonType === "demos-state-user";
  const navigate = useNavigate();
  const { data, loading, error } = useQuery<DeliverablesTabQueryResult>(
    isStateUser ? STATE_USER_DELIVERABLES_PAGE_QUERY : DELIVERABLES_PAGE_QUERY
  );
  const deliverables = isStateUser
    ? getStateUserDemonstrationDeliverables(data, parentDemonstration.id)
    : (data?.deliverables?.filter(
        (deliverable) => deliverable.demonstration.id === parentDemonstration.id
      ) ?? []);

  return (
    <div className="flex flex-col">
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
      {loading && <div className="p-4">Loading deliverables...</div>}
      {error && <div className="p-4 text-red-500">Error loading deliverables.</div>}
      {!loading && !error && (
        <DemonstrationDeliverableTable
          deliverables={deliverables}
          viewMode={viewMode}
          onViewDeliverable={(selectedDeliverableId) =>
            navigate(`/deliverables/${selectedDeliverableId}`)
          }
        />
      )}
    </div>
  );
};
