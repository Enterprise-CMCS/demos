import React from "react";
import { gql } from "@apollo/client";
import type { Deliverable, Person, State, UserType } from "demos-server";

import { DeliverableColumns } from "../columns/DeliverableColumns";
import { Table, type TableProps } from "../Table";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";
import { KeywordSearch } from "../KeywordSearch";
import { CircleButton } from "components/index";
import { DeleteIcon } from "components/icons/Action/DeleteIcon";
import { selectionTooltip } from "./actionTooltips";
import { ImportIcon } from "components/icons/Action/ImportIcon";
import { EditIcon } from "components/icons/Navigation/EditIcon";
import { sortDeliverablesByDefault } from "util/sortDeliverables";
import { isDeliverableEditable } from "components/dialog/deliverable";
import { useDialog } from "components/dialog/DialogContext";
import { getDeliverableFilterOptions } from "./deliverablesFilterOptions";

export type DeliverableTableRow = Omit<
  Deliverable,
  | "demonstration"
  | "cmsOwner"
  | "demonstrationTypes"
  | "cmsDocuments"
  | "stateDocuments"
  | "name"
  | "dueDateType"
  | "expectedToBeSubmitted"
  | "deliverableActions"
  | "createdAt"
  | "updatedAt"
> & {
  name: string;
  demonstration: Pick<Deliverable["demonstration"], "id" | "name"> & {
    state: Pick<State, "id">;
    demonstrationTypes: {
      demonstrationTypeName: string;
      approvalStatus: "Approved" | "Unapproved";
    }[];
  };
  cmsOwner: Pick<Deliverable["cmsOwner"], "id"> & {
    person: Pick<Person, "fullName" | "id">;
  };
  submissionDate?: string;
};

export type DeliverablesQueryResult = {
  deliverables: DeliverableTableRow[];
};

export const DELIVERABLES_PAGE_QUERY = gql`
  query GetDeliverablesPage {
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
    }
  }
`;

const EMPTY_ROWS_MESSAGE = "There are no assigned Deliverables at this time";
const NO_RESULTS_FOUND = "No deliverables match your search.";

export const formatDeliverableStatus = ({ status }: Pick<Deliverable, "status">) => status;

export const DeliverableTable: React.FC<{
  deliverables: DeliverableTableRow[];
  emptyRowsMessage?: string;
  viewMode: UserType;
}> = ({ deliverables, emptyRowsMessage = EMPTY_ROWS_MESSAGE, viewMode }) => {
  const { showEditDeliverableDialog } = useDialog();
  const { demonstrationNameOptions, cmsOwnerOptions } = getDeliverableFilterOptions(deliverables);
  const deliverableColumns = DeliverableColumns({
    viewMode,
    demonstrationNameOptions,
    cmsOwnerOptions,
  });
  const formattedDeliverables = sortDeliverablesByDefault(deliverables).map((deliverable) => ({
    ...deliverable,
    status: formatDeliverableStatus(deliverable),
  }));

  type DeliverableActionButtons = NonNullable<TableProps<DeliverableTableRow>["actionButtons"]>;

  const renderActionButtons: DeliverableActionButtons = (table) => {
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedCount = selectedRows.length;
    const singleSelectedDeliverable = selectedCount === 1 ? selectedRows[0].original : null;

    const selectedIsEditable =
      singleSelectedDeliverable === null || isDeliverableEditable(singleSelectedDeliverable.status);
    const editEnabled = selectedCount === 1 && selectedIsEditable;
    const deleteEnabled = selectedCount >= 1;

    const baseEditTooltip = selectionTooltip({
      action: "Edit",
      nounSingular: "Deliverable",
      selectedCount,
      rule: { kind: "exactly", count: 1 },
    });
    const editTooltip =
      selectedCount === 1 && !selectedIsEditable ? "Select a Deliverable to Edit" : baseEditTooltip;

    const deleteTooltip = selectionTooltip({
      action: "Delete",
      nounSingular: "Deliverable",
      selectedCount,
      rule: { kind: "atLeast", count: 1 },
    });

    return (
      <div className="flex gap-1 ml-4">
        <CircleButton
          name="add-deliverable"
          ariaLabel="Add Deliverable"
          tooltip="Add Deliverable"
          onClick={() => {}}
        >
          <ImportIcon />
        </CircleButton>

        <CircleButton
          name="edit-deliverable"
          ariaLabel="Edit Deliverable"
          tooltip={editTooltip}
          disabled={!editEnabled}
          onClick={() => {
            if (singleSelectedDeliverable) {
              showEditDeliverableDialog(singleSelectedDeliverable);
            }
          }}
        >
          <EditIcon />
        </CircleButton>

        <CircleButton
          name="remove-deliverable"
          ariaLabel="Remove Deliverable"
          tooltip={deleteTooltip}
          disabled={!deleteEnabled}
          onClick={() => {}}
        >
          <DeleteIcon />
        </CircleButton>
      </div>
    );
  };

  const actionButtons = viewMode === "demos-state-user" ? undefined : renderActionButtons;

  return (
    <div className="flex flex-col gap-[24px]" data-view-mode={viewMode}>
      {deliverableColumns && (
        <Table<DeliverableTableRow>
          data={formattedDeliverables}
          columns={deliverableColumns}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columnFilter={(table) => <ColumnFilter table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          emptyRowsMessage={emptyRowsMessage}
          noResultsFoundMessage={NO_RESULTS_FOUND}
          actionButtons={actionButtons}
        />
      )}
    </div>
  );
};
