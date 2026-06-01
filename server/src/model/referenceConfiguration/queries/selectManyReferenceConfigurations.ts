import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { Prisma } from "@prisma/client";
import {
  selectManyReferenceConfigurationsRequest,
  SelectManyReferenceConfigurationsResult,
} from ".";

export async function selectManyReferenceConfigurations(
  where: Prisma.ReferenceConfigurationWhereInput,
  tx?: PrismaTransactionClient
): Promise<SelectManyReferenceConfigurationsResult[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.referenceConfiguration.findMany({
    where,
    select: selectManyReferenceConfigurationsRequest,
  });
}
