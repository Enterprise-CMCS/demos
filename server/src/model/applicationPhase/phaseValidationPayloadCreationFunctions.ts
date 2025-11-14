import { PhaseNameWithTrackedStatus, PhaseStatus, DocumentType } from "../../types.js";
import { PrismaTransactionClient } from "../../prismaClient.js";
import { PHASE_NAMES_WITH_TRACKED_STATUS } from "../../constants.js";

// All phases and statuses are guaranteed to be present by DB
export type ApplicationPhaseStatusRecord = Record<PhaseNameWithTrackedStatus, PhaseStatus>;

export async function getExistingPhaseStatuses(
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

// Not all phases will have records, so this will require special handling
export type ApplicationPhaseDocumentTypeRecord = Record<PhaseNameWithTrackedStatus, DocumentType[]>;

export async function getExistingPhaseDocumentTypes(
  applicationId: string,
  tx: PrismaTransactionClient
): Promise<ApplicationPhaseDocumentTypeRecord> {
  const results = await tx.document.findMany({
    select: {
      phaseId: true,
      documentTypeId: true,
    },
    distinct: ["phaseId", "documentTypeId"],
    where: {
      applicationId: applicationId,
      NOT: {
        phaseId: "None",
      },
    },
  });
  // Types below are guaranteed by the DB
  const phaseDocumentTypes = {} as ApplicationPhaseDocumentTypeRecord;
  for (const phase of PHASE_NAMES_WITH_TRACKED_STATUS) {
    phaseDocumentTypes[phase] = [];
  }
  for (const result of results) {
    const phaseName = result.phaseId as PhaseNameWithTrackedStatus;
    const documentType = result.documentTypeId as DocumentType;
    phaseDocumentTypes[phaseName].push(documentType);
  }
  return phaseDocumentTypes;
}
