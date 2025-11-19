import { ApplicationPhaseStatusRecord } from "..";
import { PrismaTransactionClient } from "../../../prismaClient.js";
import { PhaseNameWithTrackedStatus, PhaseStatus } from "../../../types.js";

export async function getApplicationPhaseStatuses(
  applicationId: string,
  tx: PrismaTransactionClient
): Promise<ApplicationPhaseStatusRecord> {
  const results = await tx.applicationPhase.findMany({
    select: {
      phaseId: true,
      phaseStatusId: true,
    },
    where: {
      applicationId: applicationId,
    },
  });
  // Types below are guaranteed by the DB
  return Object.fromEntries(
    results.map((phaseStatus) => [
      phaseStatus.phaseId as PhaseNameWithTrackedStatus,
      phaseStatus.phaseStatusId as PhaseStatus,
    ])
  ) as ApplicationPhaseStatusRecord;
}
