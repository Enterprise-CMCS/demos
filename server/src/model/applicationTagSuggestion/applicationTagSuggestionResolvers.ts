import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma } from "../../prismaClient";
import { setApplicationTags } from "../applicationTagAssignment";
import { PrismaApplication } from "../application/applicationTypes";
import { getApplication } from "../application";
import { UpdateApplicationTagSuggestionInput } from "./applicationTagSuggestionSchema";

export async function acceptApplicationTagSuggestion(
  _: unknown,
  { input }: { input: UpdateApplicationTagSuggestionInput },
): Promise<PrismaApplication> {
  try {
    await prisma().$transaction(async (tx) => {
      // Fetch suggestion
      const suggestion = await tx.applicationTagSuggestion.findUniqueOrThrow({
        where: { id: input.suggestionId },
      });

      // Update suggestion status
      await tx.applicationTagSuggestion.update({
        where: { id: input.suggestionId },
        data: { status: { connect: { id: "Accepted" } } },
      });

      // Fetch existing tags
      const existingTags = await tx.applicationTagAssignment.findMany({
        where: { applicationId: suggestion.applicationId },
        select: { tagNameId: true },
      });
      const tagNames = existingTags.map((t) => t.tagNameId);

      // Add the suggested tag if not already present
      if (!tagNames.includes(suggestion.value)) {
        tagNames.push(suggestion.value);
      }

      // Apply all tags using setApplicationTags
      await setApplicationTags(_, {
        input: {
          applicationId: suggestion.applicationId,
          applicationTags: tagNames,
        },
      });
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.applicationId);
}

export async function replaceApplicationTagSuggestion(
  _: unknown,
  { suggestionId, newValue }: { suggestionId: string; newValue: string },
): Promise<void> {
  try {
    await prisma().$transaction(async (tx) => {
      const suggestion = await tx.applicationTagSuggestion.findUniqueOrThrow({
        where: { id: suggestionId },
      });

      // Update suggestion status
      await tx.applicationTagSuggestion.update({
        where: { id: suggestionId },
        data: { status: { connect: { id: "Replaced" } } },
      });

      // Fetch existing tags
      const existingTags = await tx.applicationTagAssignment.findMany({
        where: { applicationId: suggestion.applicationId },
        select: { tagNameId: true },
      });
      const tagNames = existingTags.map((t) => t.tagNameId);

      // Replace old suggested value if it exists, else just add newValue
      const index = tagNames.indexOf(suggestion.value);
      if (index >= 0) {
        tagNames[index] = newValue;
      } else if (!tagNames.includes(newValue)) {
        tagNames.push(newValue);
      }

      // Apply updated tags
      await setApplicationTags(_, {
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
): Promise<void> {
  try {
    return prisma().$transaction(async (tx) => {
      await tx.applicationTagSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: {
            connect: { id: "Removed" },
          },
        },
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
