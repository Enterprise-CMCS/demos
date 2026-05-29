import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { Prisma } from "@prisma/client";
import { NonEmptyString, TagName } from "../../../types";

export type SelectManyReferenceConfigurationsResult = {
  id: string;
  reference: {
    name: NonEmptyString;
    description: NonEmptyString;
    referenceTagAssignments: {
      tag: {
        tagNameId: TagName;
        statusId: string;
      };
    }[];
    referenceDemonstrationTypes: {
      tag: {
        tagNameId: TagName;
        statusId: string;
      };
    }[];
    createdAt: Date;
    updatedAt: Date;
  };
  referenceAgreement: {
    id: string;
    name: NonEmptyString;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

export async function selectManyReferenceConfigurations(
  where: Prisma.ReferenceConfigurationWhereInput,
  tx?: PrismaTransactionClient
): Promise<SelectManyReferenceConfigurationsResult[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.referenceConfiguration.findMany({
    where,
    select: {
      id: true,
      reference: {
        select: {
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
