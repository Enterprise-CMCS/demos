import { Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

const applicationTagSuggestionDetailsInclude =
  Prisma.validator<Prisma.ApplicationTagSuggestionInclude>()({
    extracts: {
      include: {
        uiPathValue: {
          include: {
            result: {
              include: {
                document: true,
              },
            },
          },
        },
      },
      orderBy: [{ startPageNo: "asc" }],
    },
  });

export type ApplicationTagSuggestionDetailsQueryResult =
  Prisma.ApplicationTagSuggestionGetPayload<{
    include: typeof applicationTagSuggestionDetailsInclude;
  }>;

export async function selectManyApplicationTagSuggestionDetails(
  where: Prisma.ApplicationTagSuggestionWhereInput,
  tx?: PrismaTransactionClient,
): Promise<ApplicationTagSuggestionDetailsQueryResult[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.applicationTagSuggestion.findMany({
    where,
    include: applicationTagSuggestionDetailsInclude,
  });
}
