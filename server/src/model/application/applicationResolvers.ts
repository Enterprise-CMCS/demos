import { prisma } from "../../prismaClient.js";
import { TagStatus, UiPathResultStatus } from "../../types.js";
import {
  Document as PrismaDocument,
  ApplicationPhase as PrismaApplicationPhase,
} from "@prisma/client";
import { setApplicationClearanceLevel, PrismaApplication } from ".";
import { Tag } from "../tag";

export async function resolveApplicationDocuments(
  parent: PrismaApplication
): Promise<PrismaDocument[] | null> {
  return await prisma().document.findMany({
    where: {
      applicationId: parent.id,
    },
  });
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
  return result;
}

export async function resolveApplicationTags(parent: PrismaApplication): Promise<Tag[]> {
  const applicationTags = await prisma().applicationTagAssignment.findMany({
    where: {
      applicationId: parent.id,
    },
    include: {
      tag: true,
    },
  });
  return applicationTags.map((tagAssignment) => ({
    tagName: tagAssignment.tagNameId,
    approvalStatus: tagAssignment.tag.statusId as TagStatus,
  }));
}

export async function resolveSuggestedApplicationTags(
  parent: PrismaApplication
): Promise<string[]> {
  const suggestions = await prisma().applicationTagSuggestion.findMany({
    where: {
      applicationId: parent.id,
      statusId: {
        in: ["Pending" satisfies UiPathResultStatus],
      },
    },
    select: {
      value: true,
    },
  });

  return suggestions.map((s) => s.value);
}

export const applicationResolvers = {
  Mutation: {
    setApplicationClearanceLevel: setApplicationClearanceLevel,
  },
  Application: {
    __resolveType: resolveApplicationType,
  },
};
