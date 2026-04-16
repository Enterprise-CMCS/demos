import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma } from "../../prismaClient";
import { setApplicationTags } from "../applicationTagAssignment";
import { PrismaApplication } from "../application/applicationTypes";
import { ApplicationTagSuggestion } from "@prisma/client";

export async function acceptApplicationTagSuggestion(
  _: unknown,
  { suggestionId }: { suggestionId: string },
): Promise<PrismaApplication> {
  try {
    console.log(`_ is ${JSON.stringify(_)}, suggestionId is ${suggestionId}`);
    return await prisma().$transaction(async (tx) => {
      const suggestion = await tx.applicationTagSuggestion.findUniqueOrThrow({
        where: { id: suggestionId },
      });

      await tx.applicationTagSuggestion.update({
        where: { id: suggestionId },
        data: { statusId: "Accepted" },
      });

      const existingTags = await tx.applicationTagAssignment.findMany({
        where: { applicationId: suggestion.applicationId },
        select: { tagNameId: true },
      });
      const tagNames = existingTags.map((t) => t.tagNameId);

      if (!tagNames.includes(suggestion.value)) {
        tagNames.push(suggestion.value);
      }

      return await setApplicationTags(_, {
        input: {
          applicationId: suggestion.applicationId,
          applicationTags: tagNames,
        },
      });
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function replaceApplicationTagSuggestion(
  _: unknown,
  { suggestionId, newValue }: { suggestionId: string; newValue: string },
): Promise<PrismaApplication> {
  try {
    return await prisma().$transaction(async (tx) => {
      const suggestion = await tx.applicationTagSuggestion.findUniqueOrThrow({
        where: { id: suggestionId },
      });

      await tx.applicationTagSuggestion.update({
        where: { id: suggestionId },
        data: { statusId: "Replaced" },
      });

      const existingTags = await tx.applicationTagAssignment.findMany({
        where: { applicationId: suggestion.applicationId },
        select: { tagNameId: true },
      });
      const tagNames = existingTags.map((t) => t.tagNameId);

      if(!tagNames.includes(newValue)) {
        tagNames.push(newValue);
      }

      return await setApplicationTags(_, {
        input: {
          applicationId: suggestion.applicationId,
          applicationTags: tagNames,
        },
      });
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function removeApplicationTagSuggestion(
  _: unknown,
  { suggestionId }: { suggestionId: string },
): Promise<ApplicationTagSuggestion> {
  try {
    return prisma().$transaction(async (tx) => {
      return await tx.applicationTagSuggestion.update({
        where: { id: suggestionId },
        data: { statusId: "Removed" },
      });
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export const applicationTagSuggestionResolvers = {
  Mutation: {
    acceptApplicationTagSuggestion: acceptApplicationTagSuggestion,
    replaceApplicationTagSuggestion: replaceApplicationTagSuggestion,
    removeApplicationTagSuggestion: removeApplicationTagSuggestion,
  },
};
