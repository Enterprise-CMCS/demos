import z from "zod";
import { OnDemandReportName } from "../types";
import { basicTestReportSchema } from "./schemas/basicTestReportSchema";

export const onDemandReportConfigurations: Record<
  OnDemandReportName,
  { queryFile: string; reportRowSchema: z.ZodType<unknown> }
> = {
  "Basic Test Report": {
    queryFile: "basicTestReport.sql",
    reportRowSchema: basicTestReportSchema,
  },
};
