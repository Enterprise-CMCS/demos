import { OnDemandReportType } from "../types";
import { getOnDemandReportConfiguration } from "./configs";
import { z } from "zod";
import { PrismaTransactionClient } from "../prismaClient";

export async function runOnDemandReport(
  onDemandReportType: OnDemandReportType,
  tx: PrismaTransactionClient
) {
  const { sqlQueries, reportRowSchema } = getOnDemandReportConfiguration(onDemandReportType);
  // Note: the final query is what is returned!
  let results;
  for (const sqlQuery of sqlQueries) {
    results = await tx.$queryRawUnsafe(sqlQuery);
  }
  return z.array(reportRowSchema).parse(results);
}
