import React, { useState } from "react";
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
  const [downloadingReports, setDownloadingReports] = useState<Set<string>>(new Set());
  const { triggerDownload } = useTriggerDownload();
  const { showSuccess, showError } = useToast();
  const [ generateOnDemandReport ] = useMutation(GENERATE_ON_DEMAND_REPORT_MUTATION);

  const handleDownload = async (reportType: string) => {
    setDownloadingReports(prev => new Set(prev).add(reportType));

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
      showSuccess(`${reportType} has generated successfully.`);
    } catch (error) {
      console.error("Error generating on-demand report:", error);
      showError(`Failed to generate ${reportType} report`);
    } finally {
      setDownloadingReports(prev => {
        const next = new Set(prev);
        next.delete(reportType);
        return next;
      });
    }
  };

  const reportsColumns = ReportsColumns(handleDownload, downloadingReports);

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
