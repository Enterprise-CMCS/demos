import * as React from "react";

import { compareAsc } from "date-fns";
import { KeywordSearch } from "components/table/search";
import { PaginationControls } from "../../PaginationControls";
import { Table } from "../../Table";
import { TypesColumns } from "../../columns/TypesColumns";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { Notice } from "components/notice";
import { DemosApplicationSection, getCurrentUser, isReadonly } from "components/user/UserContext";
import { DemonstrationDetail } from "pages/DemonstrationDetail";
import { TypesTableActionButtons } from "./TypesTableActionButtons";

export type TypeTableRow = {
  id: string;
  typeLabel: string;
  status: DemonstrationDetailDemonstrationType["status"];
  approvalStatus: DemonstrationDetailDemonstrationType["approvalStatus"];
  effectivePlainDate: string;
  expirationPlainDate: string;
};

export const TypesTable = ({
  demonstration,
  applicationSection,
  inputDisabled = false,
  hideSearch = false,
}: {
  demonstration: Pick<DemonstrationDetail, "id" | "status" | "demonstrationTypes">;
  applicationSection: DemosApplicationSection;
  inputDisabled?: boolean;
  hideSearch?: boolean;
}) => {
  const { currentUser } = getCurrentUser();
  const isReadonlyUser = isReadonly(currentUser, applicationSection);

  const columns = TypesColumns(isReadonlyUser);

  /*
   * Ensure initial sort by createdAt date ascending
   * and map to expected data structure
   */
  const typeRows: TypeTableRow[] = React.useMemo(() => {
    return [...demonstration.demonstrationTypes]
      .sort((a, b) => compareAsc(a.createdAt, b.createdAt))
      .map((type) => ({
        id: type.demonstrationTypeName,
        typeLabel: type.demonstrationTypeName,
        status: type.status,
        approvalStatus: type.approvalStatus,
        effectivePlainDate: type.effectivePlainDate,
        expirationPlainDate: type.expirationPlainDate,
      }));
  }, [demonstration.demonstrationTypes]);

  return (
    <div className="overflow-x-auto w-full mb-2 flex flex-col gap-1">
      {demonstration.status === "Approved" && (
        <Notice title="At least one demonstration type is required for approved demonstrations." />
      )}
      {columns && (
        <Table<TypeTableRow>
          data={typeRows}
          columns={columns}
          keywordSearch={!hideSearch ? (table) => <KeywordSearch table={table} /> : undefined}
          pagination={(table) => <PaginationControls table={table} />}
          emptyRowsMessage="You have no assigned Types at this time"
          noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
          actionButtons={(table) =>
            !isReadonlyUser && (
              <TypesTableActionButtons
                rows={table.getRowModel().rows.map((row) => row.original)}
                selectedRows={table.getSelectedRowModel().rows.map((row) => row.original)}
                demonstrationId={demonstration.id}
                inputDisabled={inputDisabled}
              />
            )
          }
        />
      )}
    </div>
  );
};
