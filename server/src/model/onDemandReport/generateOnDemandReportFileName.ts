import type { OnDemandReportType } from "../../types";
import type { EasternNow } from "../../dateUtilities";
import { format } from "date-fns";

const REPORT_FILE_NAME_MAP: Record<OnDemandReportType, string> = {
  "Basic Test Report": "Basic_Test_Report_",
  "Application Details Report": "Application_Details_Report_",
  "Deliverable Status Report": "Deliverable_Status_Report_",
  "Demonstration Overview Report": "Demonstration_Overview_Report_",
  "Demonstration Types Report": "Demonstration_Types_Report_",
};

export function generateOnDemandReportFileName(
  reportType: OnDemandReportType,
  generatedDate: EasternNow
): string {
  const dateString = format(generatedDate["Current Time"].easternTZDate, "yyyyMMdd_kkmmss");
  return REPORT_FILE_NAME_MAP[reportType] + dateString + "_ET";
}
