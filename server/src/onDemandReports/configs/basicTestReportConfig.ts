import { z } from "zod";
import {
  OnDemandReportColumnConfiguration,
  OnDemandReportColumnSchema,
  OnDemandReportConfiguration,
} from "./onDemandReportConfigTypes";
import { basicTestReportQueries } from "./basicTestReportQueries";

type BasicTestReportColumn = "col1";

export const basicTestReportSchema = z
  .object({
    col1: z.string(),
  } satisfies OnDemandReportColumnSchema<BasicTestReportColumn>)
  .strict();

export const basicTestReportColumnHeaders = {
  col1: { columnName: "Column 1" },
} satisfies OnDemandReportColumnConfiguration<BasicTestReportColumn>;

export const basicTestReportConfiguration = {
  sqlQueries: basicTestReportQueries,
  reportRowSchema: basicTestReportSchema,
  excelConfiguration: { columns: basicTestReportColumnHeaders },
} satisfies OnDemandReportConfiguration;
