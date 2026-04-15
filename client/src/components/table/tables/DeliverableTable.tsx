import React from "react";
import { gql } from "@apollo/client";
import type { Deliverable, Person, PersonType, State } from "demos-server";

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

export type DeliverableTableRow = Omit<
  Deliverable,
  "demonstration" | "cmsOwner" | "cmsDocuments" | "stateDocuments" | "name"
> & {
  name: string;
  demonstration: Pick<Deliverable["demonstration"], "id" | "name"> & {
    state: Pick<State, "id">;
  };
  cmsOwner: Pick<Deliverable["cmsOwner"], "id"> & {
    person: Pick<Person, "fullName" | "id">;
  };
  submissionDate?: string;
  cmsDocuments: Pick<Deliverable["cmsDocuments"][number], "id">[];
  stateDocuments: Pick<Deliverable["stateDocuments"][number], "id">[];
};
export type DeliverableTableViewMode = Exclude<PersonType, "non-user-contact">;
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
      dueDateType
      expectedToBeSubmitted
      cmsDocuments {
        id
      }
      stateDocuments {
        id
      }
      createdAt
      updatedAt
    }
  }
`;

const EMPTY_ROWS_MESSAGE = "There are no assigned Deliverables at this time";
const NO_RESULTS_FOUND = "No results were returned. Adjust your search and filter criteria.";

export const formatDeliverableStatus = ({
  status,
}: Pick<Deliverable, "status">) => status;

export const DeliverableTable: React.FC<{
  deliverables: DeliverableTableRow[];
  emptyRowsMessage?: string;
  viewMode: DeliverableTableViewMode;
}> = ({
  deliverables,
  emptyRowsMessage = EMPTY_ROWS_MESSAGE,
  viewMode,
}) => {
  const deliverableColumns = DeliverableColumns({ viewMode });
  const formattedDeliverables = sortDeliverablesByDefault(deliverables).map((deliverable) => ({
    ...deliverable,
    status: formatDeliverableStatus(deliverable),
  }));

  const showAddDeliverableDialog = () => { };
  const showEditDeliverableDialog = () => { };
  const showRemoveDeliverableDialog = () => { };
  type DeliverableActionButtons = NonNullable<TableProps<DeliverableTableRow>["actionButtons"]>;

  const renderActionButtons: DeliverableActionButtons = (table) => {
    const selectedCount = table.getSelectedRowModel().rows.length;

    const editEnabled = selectedCount === 1;
    const deleteEnabled = selectedCount >= 1;

    const editTooltip = selectionTooltip({
      action: "Edit",
      nounSingular: "Deliverable",
      selectedCount,
      rule: { kind: "exactly", count: 1 },
    });

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
          onClick={() => showAddDeliverableDialog()}
        >
          <ImportIcon />
        </CircleButton>

        <CircleButton
          name="edit-deliverable"
          ariaLabel="Edit Deliverable"
          tooltip={editTooltip}
          disabled={!editEnabled}
          onClick={() => showEditDeliverableDialog()}
        >
          <EditIcon />
        </CircleButton>

        <CircleButton
          name="remove-deliverable"
          ariaLabel="Remove Deliverable"
          tooltip={deleteTooltip}
          disabled={!deleteEnabled}
          onClick={() => showRemoveDeliverableDialog()}
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
