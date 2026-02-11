import { prisma } from "../../prismaClient.js";
import { ClearanceLevel, Tag } from "../../types.js";
import {
  Document as PrismaDocument,
  ApplicationPhase as PrismaApplicationPhase,
  ApplicationTagAssignment as PrismaApplicationTagAssignment,
} from "@prisma/client";
import { setApplicationClearanceLevel, PrismaApplication } from ".";

export async function resolveApplicationDocuments(
  parent: PrismaApplication
): Promise<PrismaDocument[] | null> {
  return await prisma().document.findMany({
    where: {
      applicationId: parent.id,
    },
  });
}

export function resolveApplicationCurrentPhaseName(parent: PrismaApplication): string {
  return parent.currentPhaseId;
}

export function resolveApplicationStatus(parent: PrismaApplication): string {
  return parent.statusId;
}

export function resolveApplicationSdgDivision(parent: PrismaApplication): string | null {
  return parent.sdgDivisionId;
}

export function resolveApplicationSignatureLevel(parent: PrismaApplication): string | null {
  return parent.signatureLevelId;
}

export function resolveApplicationType(parent: PrismaApplication): string {
  return parent.applicationTypeId;
}

export async function resolveApplicationPhases(
  parent: PrismaApplication
): Promise<PrismaApplicationPhase[]> {
  // The phases are prepopulated by the database so this is never null
  const result = await prisma().applicationPhase.findMany({
    where: {
      applicationId: parent.id,
    },
  });
  return result!;
}

export function resolveApplicationClearanceLevel(parent: PrismaApplication): ClearanceLevel {
  // clearance level casting enforced by database constraints
  return parent.clearanceLevelId as ClearanceLevel;
}

export async function resolveApplicationTags(parent: PrismaApplication): Promise<Tag[]> {
  const applicationTags: Pick<PrismaApplicationTagAssignment, "tagId">[] =
    await prisma().applicationTagAssignment.findMany({
      where: {
        applicationId: parent.id,
      },
      select: {
        tagId: true,
      },
    });
  return applicationTags.map((tag) => tag.tagId);
}

export const applicationResolvers = {
  Mutation: {
    setApplicationClearanceLevel: setApplicationClearanceLevel,
  },
  Application: {
    __resolveType: resolveApplicationType,
  },
};
