import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function insertReferenceAgreementAcceptance(
  input: {
    referenceId: string;
    referenceAgreementId: string;
    userId: string;
  },
  tx?: PrismaTransactionClient
): Promise<void> {
  const prismaClient = tx ?? prisma();
  await prismaClient.referenceAgreementAcceptance.create({
    data: { ...input },
  });
}
