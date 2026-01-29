import { prisma } from "../../../prismaClient";
import { ApplicationType } from "../../../types";
import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
} from "@prisma/client";
import { FindApplicationQueryResult, PrismaApplication } from "..";

export async function getManyApplications(
  applicationTypeId: "Demonstration"
): Promise<PrismaDemonstration[]>;

export async function getManyApplications(
  applicationTypeId: "Amendment"
): Promise<PrismaAmendment[]>;

export async function getManyApplications(
  applicationTypeId: "Extension"
): Promise<PrismaExtension[]>;

export async function getManyApplications(
  applicationTypeId: ApplicationType
): Promise<PrismaApplication[]> {
  const applications: FindApplicationQueryResult[] | null = await prisma().application.findMany({
    where: {
      applicationTypeId: applicationTypeId,
    },
    include: {
      demonstration: true,
      amendment: true,
      extension: true,
    },
  });

  if (!applications) {
    return [];
  }

  const results: PrismaApplication[] = [];
  for (const application of applications) {
    results.push((application.demonstration ?? application.amendment ?? application.extension)!);
  }
  return results;
}
