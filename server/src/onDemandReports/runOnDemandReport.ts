import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OnDemandReportType } from "../types";
import { prisma } from "../prismaClient";
import { z } from "zod";
import { ON_DEMAND_REPORT_CONFIGURATIONS } from "./onDemandReportConfigurations";

export async function runOnDemandReport(
  onDemandReportType: OnDemandReportType,
  client: ReturnType<typeof prisma>
) {
  const { queryFile, reportRowSchema } = ON_DEMAND_REPORT_CONFIGURATIONS[onDemandReportType];
  const sqlToRun = readFileSync(join(__dirname, "queries", queryFile), "utf-8");
  const results = await client.$queryRawUnsafe(sqlToRun);
  return z.array(reportRowSchema).parse(results);
}
