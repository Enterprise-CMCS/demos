import type { EasternTZDate } from "../dateUtilities";
import type { OnDemandReportType } from "../types";
import type { OnDemandReportRow } from "./configs";

import { getOnDemandReportConfiguration } from "./configs";
import { Workbook } from "@cj-tech-master/excelts";

export type ReportMetadata = {
  requestId: string;
  requestTimestamp: EasternTZDate;
};

export async function formatOnDemandReportInExcel<T extends OnDemandReportType>(
  reportType: T,
  rows: OnDemandReportRow<T>[],
  reportMetadata: ReportMetadata
): Promise<Buffer> {
  const workbook = new Workbook();
  const primaryWorksheet = workbook.addWorksheet(reportType);
  const metadataWorksheet = workbook.addWorksheet("Report Metadata");

  const { columns } = getOnDemandReportConfiguration(reportType).excelConfiguration;
  primaryWorksheet.columns = Object.entries(columns).map((column) => ({
    key: column[0],
    header: column[1].columnName,
  }));

  for (const row of rows) {
    const addedRow = primaryWorksheet.addRow(row);
    addedRow.alignment = { wrapText: true };

    // Note: I'm pretty sure this is expressed in typographic points
    // 12 seems to return a sheet where the rows are 16, which is the default if this isn't set
    addedRow.height = 12;
  }

  primaryWorksheet.getRow(1).font = { bold: true };
  primaryWorksheet.getRow(1).alignment = { wrapText: true };
  primaryWorksheet.autoFitColumns();

  for (const column of Object.entries(columns)) {
    if (column[1].columnWidth !== undefined) {
      primaryWorksheet.getColumn(column[0]).width = column[1].columnWidth;
    }
  }

  metadataWorksheet.addRow(["Request Id", reportMetadata.requestId]);
  metadataWorksheet.addRow([
    "Request Timestamp",
    reportMetadata.requestTimestamp.easternTZDate.toISOString(),
  ]);
  metadataWorksheet.getColumn(1).font = { bold: true };
  metadataWorksheet.getColumn(2).alignment = { horizontal: "right" };
  metadataWorksheet.getRow(2).getCell(2).numFmt = "@";
  metadataWorksheet.autoFitColumns();

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
