import { OnDemandReport as PrismaOnDemandReport, Prisma } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";

export async function insertOnDemandReport(
  input: Prisma.OnDemandReportUncheckedCreateInput,
  tx: PrismaTransactionClient
): Promise<PrismaOnDemandReport> {
  return await tx.onDemandReport.create({ data: { ...input } });
}
