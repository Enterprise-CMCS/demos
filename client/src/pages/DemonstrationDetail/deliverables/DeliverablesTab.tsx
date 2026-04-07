import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { useDialog } from "components/dialog/DialogContext";
import { Deliverable } from "pages/DeliverablesPage";
import { Table } from "components/table/Table";
import { createDateColumnDef } from "components/table/columns/dateColumn";
import { highlightCell, KeywordSearch } from "components/table/KeywordSearch";
import { ColumnFilter } from "components/table/ColumnFilter";
import { PaginationControls } from "components/table/PaginationControls";
import { formatDeliverableStatus } from "components/table/tables/DeliverableTable";
import { AddDeliverableSlotDemonstration } from "components/dialog/deliverable/AddDeliverableSlotDialog";

export const ADD_DELIVERABLE_SLOT_BUTTON_NAME = "button-add-deliverable-slot";
const EMPTY_ROWS_MESSAGE = "You have no assigned Deliverables at this time";
const NO_SEARCH_RESULTS_MESSAGE =
  "No results were returned. Adjust your search and filter criteria.";

type DemonstrationDeliverableTableRow = Pick<
  Deliverable,
  | "id"
  | "deliverableType"
  | "deliverableName"
  | "cmsOwner"
  | "dueDate"
  | "submissionDate"
  | "status"
>;

export const DeliverablesTab = ({
  parentDemonstration,
  deliverables,
}: {
  parentDemonstration: AddDeliverableSlotDemonstration;
  deliverables: Deliverable[];
}) => {
  const { showAddDeliverableSlotDialog } = useDialog();
  const columnHelper = createColumnHelper<DemonstrationDeliverableTableRow>();

  const columns = [
    columnHelper.accessor("deliverableType", {
      header: "Deliverable Type",
      cell: highlightCell,
    }),
    columnHelper.accessor("deliverableName", {
      header: "Deliverable Name",
      cell: highlightCell,
    }),
    columnHelper.accessor("cmsOwner", {
      header: "CMS Owner",
      cell: highlightCell,
    }),
    createDateColumnDef(columnHelper, "dueDate", "Due Date"),
    createDateColumnDef(columnHelper, "submissionDate", "Submission Date"),
    columnHelper.accessor("status", {
      header: "Status",
      cell: highlightCell,
    }),
  ];

  const formattedDeliverables = deliverables.map((deliverable) => ({
    ...deliverable,
    status: formatDeliverableStatus(deliverable),
  }));

  return (
    <div className="flex flex-col gap-[24px]">
      <TabHeader title="Deliverables Management">
        <IconButton
          icon={<AddNewIcon />}
          name={ADD_DELIVERABLE_SLOT_BUTTON_NAME}
          size="small"
          onClick={() => showAddDeliverableSlotDialog(parentDemonstration)}
        >
          Add Deliverable Slot
        </IconButton>
      </TabHeader>

      <Table<DemonstrationDeliverableTableRow>
        data={formattedDeliverables}
        columns={columns}
        keywordSearch={(table) => <KeywordSearch table={table} />}
        columnFilter={(table) => <ColumnFilter table={table} />}
        pagination={(table) => <PaginationControls table={table} />}
        emptyRowsMessage={EMPTY_ROWS_MESSAGE}
        noResultsFoundMessage={NO_SEARCH_RESULTS_MESSAGE}
      />
    </div>
  );
};
