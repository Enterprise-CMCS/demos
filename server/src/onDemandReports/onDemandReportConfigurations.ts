import z from "zod";
import { OnDemandReportType } from "../types";
import { basicTestReportSchema } from "./schemas/basicTestReportSchema";

export const onDemandReportConfigurations: Record<
  OnDemandReportType,
  { queryFile: string; reportRowSchema: z.ZodType<unknown> }
> = {
  "Basic Test Report": {
    queryFile: "basicTestReport.sql",
    reportRowSchema: basicTestReportSchema,
  },
};
