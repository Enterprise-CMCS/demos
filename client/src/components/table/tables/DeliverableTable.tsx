import React from "react";

import { Deliverable } from "pages/DeliverablesPage";
import { DeliverableColumns } from "../columns/DeliverableColumns";
import { Table } from "../Table";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";
import { KeywordSearch } from "../KeywordSearch";
import { CircleButton } from "components/index";
import { DeleteIcon } from "components/icons/Action/DeleteIcon";
import { selectionTooltip } from "./actionTooltips";
import { ImportIcon } from "components/icons/Action/ImportIcon";
import { EditIcon } from "components/icons/Navigation/EditIcon";

export type DeliverableTableRow = {
  id: string;
  deliverableName: string;
  demonstrationName: string;
  deliverableType: string;
  cmsOwner: string;
  dueDate: string;
  submissionDate?: string;
  status: string;
  state: { id: string };
};

const DEFAULT_EMPTY_ROWS_MESSAGE = "There are no assigned Deliverables at this time";
const DEFAULT_NO_SEARCH_RESULTS_MESSAGE =
  "No results were returned. Adjust your search and filter criteria.";

export const formatDeliverableStatus = ({
  status,
  extensionRequested = false,
  resubmissionCount = 0,
}: Pick<Deliverable, "status" | "extensionRequested" | "resubmissionCount">) => {
  if (status !== "Upcoming") return status;

  const hasResubmission = resubmissionCount > 0;
  const hasExtensionRequested = extensionRequested;

  let combinedStatus = status;

  if (hasResubmission) {
    combinedStatus += ` (${resubmissionCount})`;
  }

  if (hasExtensionRequested) {
    combinedStatus += " - Extension Requested";
  }

  return combinedStatus;
};

export const DeliverableTable: React.FC<{ deliverables: Deliverable[] }> = ({
  deliverables,
}) => {
  const deliverableColumns = DeliverableColumns();
  const formattedDeliverables = deliverables.map((deliverable) => ({
    ...deliverable,
    status: formatDeliverableStatus(deliverable),
  }));

  /* const { showAddDeliverableDialog, showEditDeliverableDialog, showRemoveDeliverableDialog } = useDialog(); */
  const showAddDeliverableDialog = () => { };
  const showEditDeliverableDialog = () => { };
  const showRemoveDeliverableDialog = () => { };

  return (
    <div className="flex flex-col gap-[24px]">
      {deliverableColumns && (
        <Table<DeliverableTableRow>
          data={formattedDeliverables}
          columns={deliverableColumns}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columnFilter={(table) => <ColumnFilter table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          emptyRowsMessage={DEFAULT_EMPTY_ROWS_MESSAGE}
          noResultsFoundMessage={DEFAULT_NO_SEARCH_RESULTS_MESSAGE}
          actionButtons={(table) => {
            const selectedDeliverables = table.getSelectedRowModel().rows.map((row) => row.original);
            const selectedCount = selectedDeliverables.length;

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
          }}
        />
      )}
    </div>
  );
};
