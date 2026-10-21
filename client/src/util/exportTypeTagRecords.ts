import { TAG_STATUS_LABELS } from "components/badge/TagStatusBadge";
import type { TypeTagAssociatedRecordRow } from "components/table/columns/TypeTagAssociatedRecordsColumns";
import { downloadExcel, type ExcelColumn } from "components/table/exportExcel";

export const TYPE_TAG_RECORD_EXPORT_COLUMNS: ExcelColumn<TypeTagAssociatedRecordRow>[] = [
  { header: "Type/Tag Name", value: (row) => row.tagName },
  { header: "Record Type", value: (row) => row.recordType },
  { header: "Related Item Name", value: (row) => row.relatedItemName },
  { header: "State/Territory", value: (row) => row.stateName },
  { header: "Status", value: (row) => TAG_STATUS_LABELS[row.approvalStatus] },
  { header: "Project Officer", value: (row) => row.projectOfficerName },
  { header: "Link", value: (row) => new URL(row.href, window.location.origin).href },
];

export const exportTypeTagRecords = (rows: TypeTagAssociatedRecordRow[]): Promise<void> =>
  downloadExcel({
    filename: "type-tag-associated-records.xlsx",
    sheetName: "Associated Records",
    rows,
    columns: TYPE_TAG_RECORD_EXPORT_COLUMNS,
  });
