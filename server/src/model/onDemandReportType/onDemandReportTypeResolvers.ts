import { generateCustomSetScalar } from "../../customScalarResolvers";
import { ON_DEMAND_REPORT_TYPES } from "../../constants";

export const onDemandReportTypeResolvers = {
  OnDemandReportType: generateCustomSetScalar(
    ON_DEMAND_REPORT_TYPES,
    "OnDemandReportType",
    "A string name for an on-demand report."
  ),
};
