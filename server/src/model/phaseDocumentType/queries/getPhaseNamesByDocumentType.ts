import { Phase as PrismaPhase } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { DocumentType } from "../../../types";

export async function getPhasesByDocumentType(
  tx: PrismaTransactionClient,
  documentType: DocumentType
): Promise<PrismaPhase[]> {
  const phaseDocumentTypes = await tx.phaseDocumentType.findMany({
    include: {
      phase: true,
    },
    where: {
      documentTypeId: documentType,
    },
  });

  return phaseDocumentTypes.map((phaseDocumentType) => phaseDocumentType.phase);
}
