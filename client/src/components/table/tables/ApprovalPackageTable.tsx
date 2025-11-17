import React from "react";
import { Table } from "../Table";
import { ApprovalPackageColumns } from "../columns/ApprovalPackageColumns";
import { ApplicationWorkflowDocument } from "components/application/ApplicationWorkflow";

export interface ApprovalPackageTableRow {
  documentType: string;
  id?: string;
  name: string;
  description: string;
  uploadedBy: string;
  uploadedDate: string;
  document?: ApplicationWorkflowDocument;
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
