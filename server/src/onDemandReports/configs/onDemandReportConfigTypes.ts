import { z } from "zod";

export type OnDemandReportColumnSpecification = {
  columnName: string;
  columnWidth?: number;
};
export type OnDemandReportColumnSchema<T extends string> = Record<T, z.ZodType>;
export type OnDemandReportColumnConfiguration<T extends string> = Record<
  T,
  OnDemandReportColumnSpecification
>;
export type OnDemandReportConfiguration<T extends z.ZodType = z.ZodType> = {
  sqlQueries: string[];
  reportRowSchema: T;
  excelConfiguration: { columns: Record<string, OnDemandReportColumnSpecification> };
};
