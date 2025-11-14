import React from "react";
import { Table } from "../Table";
import { ApprovalPackageColumns } from "../columns/ApprovalPackageColumns";

export interface ApprovalPackageTableRow {
  documentType: string;
  id?: string;
  name: string;
  description: string;
  uploadedBy: string;
  uploadedDate: string;
}

export const ApprovalPackageTable: React.FC<{
  demonstrationId: string;
  rows: ApprovalPackageTableRow[];
}> = ({
  demonstrationId,
  rows,
}) => {
  const approvalPackageColumns = ApprovalPackageColumns(demonstrationId);

  return (
    <div className="flex flex-col gap-[24px]">
      {approvalPackageColumns && (
        <Table<ApprovalPackageTableRow>
          data={rows}
          columns={approvalPackageColumns}
        />
      )}
    </div>
  );
};
