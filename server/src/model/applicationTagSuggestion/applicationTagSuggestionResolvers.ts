import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { setApplicationTags } from "../applicationTagAssignment";
import { PrismaApplication } from "../application/applicationTypes";
import { ApplicationTagSuggestion as PrismaApplicationTagSuggestion } from "@prisma/client";

export async function appendApplicationTags(
  parent: unknown,
  tx: PrismaTransactionClient,
  applicationId: string,
  newValue: string
): Promise<PrismaApplication> {
  const existingTags = await tx.applicationTagAssignment.findMany({
    where: { applicationId },
    select: { tagNameId: true },
  });

  const tagNames = existingTags.map((t) => t.tagNameId);
  if (!tagNames.includes(newValue)) {
    tagNames.push(newValue);
  }

  return await setApplicationTags(parent, {
    input: {
      applicationId,
      applicationTags: tagNames,
    },
  });
}

export async function acceptApplicationTagSuggestion(
  parent: unknown,
  { applicationId, value }: { applicationId: string; value: string }
): Promise<PrismaApplication> {
  try {
    return await prisma().$transaction(async (tx) => {
      const suggestion = await tx.applicationTagSuggestion.findUniqueOrThrow({
        where: {
          applicationId_value: {
            applicationId,
            value,
          },
        },
      });

      await tx.applicationTagSuggestion.update({
        where: {
          applicationId_value: {
            applicationId,
            value,
          },
        },
        data: { statusId: "Accepted" },
      });

      return await appendApplicationTags(parent, tx, suggestion.applicationId, suggestion.value);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function replaceApplicationTagSuggestion(
  parent: unknown,
  { applicationId, value, newValue }: { applicationId: string; value: string; newValue: string }
): Promise<PrismaApplication> {
  try {
    return await prisma().$transaction(async (tx) => {
      const suggestion = await tx.applicationTagSuggestion.findUniqueOrThrow({
        where: {
          applicationId_value: {
            applicationId,
            value,
          },
        },
      });

      await tx.applicationTagSuggestion.update({
        where: {
          applicationId_value: {
            applicationId,
            value,
          },
        },
        data: { statusId: "Replaced", replacedValue: newValue },
      });

      return await appendApplicationTags(parent, tx, suggestion.applicationId, newValue);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function removeApplicationTagSuggestion(
  parent: unknown,
  { applicationId, value }: { applicationId: string; value: string }
): Promise<PrismaApplicationTagSuggestion> {
  try {
    return prisma().$transaction(async (tx) => {
      return await tx.applicationTagSuggestion.update({
        where: {
          applicationId_value: {
            applicationId,
            value,
          },
        },
        data: { statusId: "Removed" },
      });
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export const applicationTagSuggestionResolvers = {
  Mutation: {
    acceptApplicationTagSuggestion,
    replaceApplicationTagSuggestion,
    removeApplicationTagSuggestion,
  },
};
