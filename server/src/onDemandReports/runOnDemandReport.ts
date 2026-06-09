import { OnDemandReportType } from "../types";
import { getOnDemandReportConfiguration } from "./configs";
import { z } from "zod";
import { PrismaTransactionClient } from "../prismaClient";

export async function runOnDemandReport(
  onDemandReportType: OnDemandReportType,
  tx: PrismaTransactionClient
) {
  const { sqlQuery, reportRowSchema } = getOnDemandReportConfiguration(onDemandReportType);
  const results = await tx.$queryRawUnsafe(sqlQuery);
  return z.array(reportRowSchema).parse(results);
}
