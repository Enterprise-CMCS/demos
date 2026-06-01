import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { SelectManyReferenceConfigurationsResult } from ".";
import { Prisma } from "@prisma/client";

export async function selectReferenceConfiguration(
  where: Prisma.ReferenceConfigurationWhereUniqueInput,
  tx?: PrismaTransactionClient
): Promise<SelectManyReferenceConfigurationsResult | null> {
  const prismaClient = tx ?? prisma();

  return await prismaClient.referenceConfiguration.findAtMostOne({
    where,
    select: {
      id: true,
      statusId: true,
      reference: {
        select: {
          id: true,
          name: true,
          description: true,
          referenceTagAssignments: {
            select: {
              tag: {
                select: {
                  tagNameId: true,
                  statusId: true,
                },
              },
            },
          },
          referenceDemonstrationTypes: {
            select: {
              tag: {
                select: {
                  tagNameId: true,
                  statusId: true,
                },
              },
            },
          },
          s3Path: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      referenceAgreement: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}
