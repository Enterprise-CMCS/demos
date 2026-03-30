import { PrismaTransactionClient } from "../../../prismaClient.js";
import { ApplicationPhaseDocumentTypeRecord } from "../index.js";
import { PHASE_NAMES } from "../../../constants.js";
import { DocumentType, PhaseName } from "../../../types.js";

export async function getApplicationPhaseDocumentTypes(
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
    },
  });
  // Types below are guaranteed by the DB
  const phaseDocumentTypes = {} as ApplicationPhaseDocumentTypeRecord;
  for (const phase of PHASE_NAMES) {
    phaseDocumentTypes[phase] = [];
  }
  for (const result of results) {
    const phaseName = result.phaseId as PhaseName;
    if (!phaseName) {
      continue;
    }
    const documentType = result.documentTypeId as DocumentType;
    phaseDocumentTypes[phaseName].push(documentType);
  }
  return phaseDocumentTypes;
}
