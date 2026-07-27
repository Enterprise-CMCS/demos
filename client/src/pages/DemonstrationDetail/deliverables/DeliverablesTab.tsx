import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { useDialog } from "components/dialog/DialogContext";
import { AddDeliverableSlotDemonstration } from "components/dialog/deliverable/AddDeliverableSlotDialog";
import { DemonstrationDeliverableTable } from "components/table/tables/DemonstrationDeliverableTable";
import { getCurrentUser } from "components/user/UserContext";
import type { UserType } from "demos-server";
import { type DeliverablesQueryResult } from "components/table/tables/DeliverableTable";
import { gql, useQuery } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react/hooks/useApolloClient";
import { useNavigate } from "react-router-dom";

export const ADD_DELIVERABLE_SLOT_BUTTON_NAME = "button-add-deliverable-slot";

export const DEMONSTRATION_DELIVERABLE_TAB = gql`
  query GetDemonstrationDeliverables($id: ID!) {
    demonstration(id: $id) {
      deliverables {
        id
        deliverableType
        name
        demonstration {
          id
          name
          state {
            id
          }
          demonstrationTypes {
            demonstrationTypeName
            approvalStatus
          }
        }
        status
        cmsOwner {
          id
          person {
            id
            fullName
          }
        }
        dueDate
        resubmissionCount
        hasOpenExtensionRequest
        latestSubmissionDate
        isDeletable
        demonstrationTypes {
          tagName
          approvalStatus
        }
      }
    }
  }
`;

export const DeliverablesTab = ({
  parentDemonstration,
}: {
  parentDemonstration: AddDeliverableSlotDemonstration;
}) => {
  const { showAddDeliverableSlotDialog } = useDialog();
  const rawPersonType = getCurrentUser().currentUser.person.personType;
  const viewMode = rawPersonType as UserType;
  const navigate = useNavigate();
  const client = useApolloClient();
  const { data, loading, error } = useQuery<{ demonstration: DeliverablesQueryResult }>(
    DEMONSTRATION_DELIVERABLE_TAB,
    { variables: { id: parentDemonstration.id } }
  );
  const deliverables = data?.demonstration.deliverables ?? [];

  return (
    <div className="flex flex-col">
      <TabHeader title="Deliverables">
        <IconButton
          icon={<AddNewIcon />}
          name={ADD_DELIVERABLE_SLOT_BUTTON_NAME}
          size="small"
          onClick={() =>
            showAddDeliverableSlotDialog(parentDemonstration, async () => {
              await client.refetchQueries({ include: [DEMONSTRATION_DELIVERABLE_TAB] });
            })
          }
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
          onDeliverablesDeleted={() => {
            void client.refetchQueries({ include: [DEMONSTRATION_DELIVERABLE_TAB] });
          }}
        />
      )}
    </div>
  );
};
