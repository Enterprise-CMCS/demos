import type { ReferenceAgreementAcceptance } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function insertReferenceAgreementAcceptance(
  input: {
    referenceId: string;
    referenceAgreementId: string;
    userId: string;
  },
  tx?: PrismaTransactionClient
): Promise<ReferenceAgreementAcceptance> {
  const prismaClient = tx ?? prisma();
  return prismaClient.referenceAgreementAcceptance.create({
    data: { ...input },
  });
}
