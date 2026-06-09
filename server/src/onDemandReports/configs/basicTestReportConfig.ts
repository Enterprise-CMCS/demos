import { z } from "zod";
import {
  OnDemandReportColumnHeader,
  OnDemandReportColumnSchema,
  OnDemandReportConfiguration,
} from "./onDemandReportConfigTypes";
import { basicTestReportQuery } from "./basicTestReportQuery";

type BasicTestReportColumn = "col1";

export const basicTestReportSchema = z
  .object({
    col1: z.string(),
  } satisfies OnDemandReportColumnSchema<BasicTestReportColumn>)
  .strict();

export const basicTestReportColumnHeaders = {
  col1: "Column 1",
} satisfies OnDemandReportColumnHeader<BasicTestReportColumn>;

export const basicTestReportConfiguration = {
  sqlQuery: basicTestReportQuery,
  reportRowSchema: basicTestReportSchema,
  excelConfiguration: { columnNames: basicTestReportColumnHeaders },
} satisfies OnDemandReportConfiguration;
