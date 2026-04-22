import { prisma } from "../../prismaClient.js";
import { UiPathResultStatus } from "../../types.js";
import { setApplicationClearanceLevel, PrismaApplication } from ".";

export function resolveApplicationType(parent: PrismaApplication): string {
  return parent.applicationTypeId;
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
