import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { ApplicationType } from "../../../types";
import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
} from "@prisma/client";
import { PrismaApplication } from "..";

export async function getManyApplications(
  applicationTypeId: "Demonstration",
  tx?: PrismaTransactionClient
): Promise<PrismaDemonstration[]>;

export async function getManyApplications(
  applicationTypeId: "Amendment",
  tx?: PrismaTransactionClient
): Promise<PrismaAmendment[]>;

export async function getManyApplications(
  applicationTypeId: "Extension",
  tx?: PrismaTransactionClient
): Promise<PrismaExtension[]>;

export async function getManyApplications(
  applicationTypeId: ApplicationType,
  tx?: PrismaTransactionClient
): Promise<PrismaApplication[]> {
  const prismaClient = tx ?? prisma();
  const applications = await prismaClient.application.findMany({
    where: {
      applicationTypeId: applicationTypeId,
    },
    include: {
      demonstration: true,
      amendment: true,
      extension: true,
    },
  });

  const results: PrismaApplication[] = [];
  for (const application of applications) {
    results.push((application.demonstration ?? application.amendment ?? application.extension)!);
  }
  return results;
}
