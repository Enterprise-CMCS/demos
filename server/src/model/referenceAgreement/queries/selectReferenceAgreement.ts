import { Prisma, ReferenceAgreement as PrismaReferenceAgreement } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export type SelectReferenceAgreementResult = Omit<PrismaReferenceAgreement, "_count"> & {
  inActiveUse: boolean;
};

export async function selectReferenceAgreement(
  where: Prisma.ReferenceAgreementWhereUniqueInput,
  tx?: PrismaTransactionClient
): Promise<SelectReferenceAgreementResult | null> {
  const prismaClient = tx ?? prisma();
  const result = await prismaClient.referenceAgreement.findAtMostOne({
    where,
    include: {
      _count: {
        select: {
          referenceConfigurations: {
            where: {
              statusId: "Active",
            },
          },
        },
      },
    },
  });
  if (result) {
    const { _count, ...rest } = result;
    return {
      ...rest,
      inActiveUse: _count.referenceConfigurations > 0,
    };
  } else {
    return null;
  }
}
