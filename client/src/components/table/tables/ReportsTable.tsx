import React from "react";
import { Table } from "../Table";
import { ReportsColumns } from "../columns/ReportsColumns";

export interface ReportsTableRow {
  id: string;
}

export const AVAILABLE_REPORT_TYPES = [
  "Demonstration Overview Report",
  "Application Details Report",
  "Demonstration Types Report",
  "Deliverable Status Report",
] as const;

export const ReportsTable: React.FC = () => {
  const reportsColumns = ReportsColumns();

  const rows: ReportsTableRow[] = AVAILABLE_REPORT_TYPES.map((reportType) => ({
    id: reportType,
  }));

  return (
    <div className="flex flex-col gap-[24px]">
      {reportsColumns && (
        <Table<ReportsTableRow> data={rows} columns={reportsColumns} />
      )}
    </div>
  );
};
