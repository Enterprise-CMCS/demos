import type { EasternTZDate } from "../dateUtilities";
import type { OnDemandReportType } from "../types";
import type { OnDemandReportRow } from "./configs";

import { getOnDemandReportConfiguration } from "./configs";
import { Workbook } from "@cj-tech-master/excelts";

type ReportMetadata = {
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

  const { columnNames } = getOnDemandReportConfiguration(reportType).excelConfiguration;
  primaryWorksheet.columns = Object.entries(columnNames).map(([key, header]) => ({ key, header }));

  for (const row of rows) {
    primaryWorksheet.addRow(row);
  }

  primaryWorksheet.getRow(1).font = { bold: true };
  primaryWorksheet.autoFitColumns();

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
