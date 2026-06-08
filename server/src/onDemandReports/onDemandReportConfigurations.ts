import { z } from "zod";
import { OnDemandReportType } from "../types";
import { basicTestReportSchema, deliverableStatusReportSchema } from "./schemas";
import { basicTestReportQuery, deliverableStatusReportQuery } from "./queries";

export const ON_DEMAND_REPORT_CONFIGURATIONS = {
  "Basic Test Report": {
    sqlQuery: basicTestReportQuery,
    reportRowSchema: basicTestReportSchema,
  },
  "Deliverable Status Report": {
    sqlQuery: deliverableStatusReportQuery,
    reportRowSchema: deliverableStatusReportSchema,
  },
} satisfies Record<OnDemandReportType, { sqlQuery: string; reportRowSchema: z.ZodType }>;
