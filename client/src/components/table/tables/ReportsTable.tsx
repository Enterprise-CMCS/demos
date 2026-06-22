import React from "react";
import { Table } from "../Table";
import { ReportsColumns } from "../columns/ReportsColumns";
import { gql } from "@apollo/client/core";
import { useMutation } from "@apollo/client/react/hooks/useMutation";
import { useTriggerDownload } from "hooks/useTriggerDownload";
import { useToast } from "components/index";

export const GENERATE_ON_DEMAND_REPORT_MUTATION = gql`
  mutation GenerateOnDemandReport($reportType: OnDemandReportType!) {
    generateOnDemandReport(reportType: $reportType)
  }
`;

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
  const { triggerDownload } = useTriggerDownload();
  const { showError } = useToast();
  const [ generateOnDemandReport ] = useMutation(GENERATE_ON_DEMAND_REPORT_MUTATION);

  const handleDownload = async (reportType: string) => {
    try {
      const { data } = await generateOnDemandReport({
        variables: {
          reportType,
        },
      });

      const downloadUrl = data?.generateOnDemandReport;

      if (!downloadUrl) {
        throw new Error("No download URL returned");
      }

      triggerDownload(downloadUrl);
    } catch (error) {
      console.error("Error generating on-demand report:", error);
      showError("Failed to generate report");
    }
  };

  const reportsColumns = ReportsColumns(handleDownload);

  const rows: ReportsTableRow[] = AVAILABLE_REPORT_TYPES.map((reportType) => ({
    id: reportType,
  }));

  return (
    <div className="flex flex-col">
      {reportsColumns && (
        <Table<ReportsTableRow> data={rows} columns={reportsColumns} />
      )}
    </div>
  );
};
