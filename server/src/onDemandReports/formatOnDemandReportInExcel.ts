import { OnDemandReportType } from "../types";
import { ON_DEMAND_REPORT_CONFIGURATIONS, OnDemandReportRow } from "./configs";
import { Workbook } from "@cj-tech-master/excelts";

export async function formatOnDemandReportInExcel<T extends OnDemandReportType>(
  reportType: T,
  rows: OnDemandReportRow<T>[]
): Promise<Buffer> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(reportType);

  worksheet.columns = Object.entries(
    ON_DEMAND_REPORT_CONFIGURATIONS[reportType].excelConfiguration.columns
  ).map(([key, header]) => ({ key, header }));

  for (const row of rows) {
    worksheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
