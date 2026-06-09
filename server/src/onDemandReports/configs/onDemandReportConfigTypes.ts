import { z } from "zod";

export type OnDemandReportColumnSchema<T extends string> = Record<T, z.ZodType>;
export type OnDemandReportColumnHeader<T extends string> = Record<T, string>;
export type OnDemandReportConfiguration = {
  sqlQuery: string;
  reportRowSchema: z.ZodType;
  excelConfiguration: { columns: Record<string, string> };
};
