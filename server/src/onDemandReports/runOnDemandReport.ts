import { readFileSync } from "fs";
import { join } from "path";
import { OnDemandReportName } from "../types";
import { PrismaClient } from "@prisma/client";
import z from "zod";
import { onDemandReportConfigurations } from ".";

export async function runOnDemandReport(
  onDemandReportName: OnDemandReportName,
  client: PrismaClient
) {
  const { queryFile, reportRowSchema } = onDemandReportConfigurations[onDemandReportName];
  const sqlToRun = readFileSync(join(__dirname, "queries", queryFile), "utf-8");
  const results = await client.$queryRawUnsafe(sqlToRun);
  return z.array(reportRowSchema).parse(results);
}
