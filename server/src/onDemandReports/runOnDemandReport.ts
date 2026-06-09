import { OnDemandReportType } from "../types";
import { ON_DEMAND_REPORT_CONFIGURATIONS } from "./configs";
import { z } from "zod";
import { PrismaTransactionClient } from "../prismaClient";

export async function runOnDemandReport(
  onDemandReportType: OnDemandReportType,
  tx: PrismaTransactionClient
) {
  const { sqlQuery, reportRowSchema } = ON_DEMAND_REPORT_CONFIGURATIONS[onDemandReportType];
  const results = await tx.$queryRawUnsafe(sqlQuery);
  return z.array(reportRowSchema).parse(results);
}
