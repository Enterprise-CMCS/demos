import { z } from "zod";
import { OnDemandReportType } from "../../types";
import { OnDemandReportConfiguration } from "./onDemandReportConfigTypes";
import { basicTestReportConfiguration } from "./basicTestReportConfig";
import { deliverableStatusReportConfiguration } from "./deliverableStatusReportConfig";
import { applicationDetailsReportConfiguration } from "./applicationDetailsReportConfig";
import { demonstrationOverviewReportConfiguration } from "./demonstrationOverviewReportConfig";
import { demonstrationTypesReportConfiguration } from "./demonstrationTypesReportConfig";

export const ON_DEMAND_REPORT_CONFIGURATIONS = {
  "Basic Test Report": basicTestReportConfiguration,
  "Deliverable Status Report": deliverableStatusReportConfiguration,
  "Application Details Report": applicationDetailsReportConfiguration,
  "Demonstration Overview Report": demonstrationOverviewReportConfiguration,
  "Demonstration Types Report": demonstrationTypesReportConfiguration,
} satisfies Record<OnDemandReportType, OnDemandReportConfiguration>;

export function getOnDemandReportConfiguration<T extends OnDemandReportType>(
  onDemandReportType: T
): OnDemandReportConfiguration<(typeof ON_DEMAND_REPORT_CONFIGURATIONS)[T]["reportRowSchema"]> {
  return ON_DEMAND_REPORT_CONFIGURATIONS[onDemandReportType];
}

// Derive the parsed row shape from the configured schema
// Present here vs. with other types to avoid a circular dependency
export type OnDemandReportRow<T extends OnDemandReportType> = z.infer<
  (typeof ON_DEMAND_REPORT_CONFIGURATIONS)[T]["reportRowSchema"]
>;
