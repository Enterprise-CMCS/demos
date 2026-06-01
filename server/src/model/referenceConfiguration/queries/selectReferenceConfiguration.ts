import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import {
  SelectManyReferenceConfigurationsResult,
  selectManyReferenceConfigurationsRequest,
} from ".";
import { Prisma } from "@prisma/client";

export async function selectReferenceConfiguration(
  where: Prisma.ReferenceConfigurationWhereUniqueInput,
  tx?: PrismaTransactionClient
): Promise<SelectManyReferenceConfigurationsResult | null> {
  const prismaClient = tx ?? prisma();

  return await prismaClient.referenceConfiguration.findAtMostOne({
    where,
    select: selectManyReferenceConfigurationsRequest,
  });
}
