import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { OnDemandReportType } from "../types";
import { prisma } from "../prismaClient";
import { z } from "zod";
import { ON_DEMAND_REPORT_CONFIGURATIONS } from "./onDemandReportConfigurations";

const __currentDir = dirname(fileURLToPath(import.meta.url));

export async function runOnDemandReport(
  onDemandReportType: OnDemandReportType,
  client: ReturnType<typeof prisma>
) {
  const { queryFile, reportRowSchema } = ON_DEMAND_REPORT_CONFIGURATIONS[onDemandReportType];
  const sqlToRun = readFileSync(join(__currentDir, "queries", queryFile), "utf-8");
  const results = await client.$queryRawUnsafe(sqlToRun);
  return z.array(reportRowSchema).parse(results);
}
