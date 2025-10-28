import { prisma } from "../../prismaClient.js";
import { GraphQLError } from "graphql";
import { ApplicationType } from "../../types.js";
import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
} from "@prisma/client";

type PrismaApplication = PrismaDemonstration | PrismaAmendment | PrismaExtension;

type FindApplicationQueryResult = {
  id: string;
  applicationTypeId: string;
  demonstration: PrismaDemonstration | null;
  amendment: PrismaAmendment | null;
  extension: PrismaExtension | null;
};

export async function getApplication(
  applicationId: string,
  applicationTypeId: ApplicationType
): Promise<PrismaApplication> {
  const application: FindApplicationQueryResult | null = await prisma().application.findUnique({
    where: {
      id: applicationId,
      applicationTypeId: applicationTypeId,
    },
    include: {
      demonstration: true,
      amendment: true,
      extension: true,
    },
  });

  if (!application) {
    throw new GraphQLError(
      `Application of type ${applicationTypeId} with ID ${applicationId} not found`,
      {
        extensions: {
          code: "APPLICATION_ID_NOT_FOUND",
        },
      }
    );
  }

  // Note that one of these three will always exist because of DB constraints
  return (application.demonstration ?? application.amendment ?? application.extension)!;
}

export async function getManyApplications(
  applicationTypeId: ApplicationType
): Promise<PrismaApplication[] | null> {
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
    return null;
  }

  const results: PrismaApplication[] = [];
  for (const application of applications) {
    results.push((application.demonstration ?? application.amendment ?? application.extension)!);
  }
  return results;
}

export const applicationResolvers = {
  Application: {
    __resolveType: async (parent: PrismaApplication) => {
      return parent.applicationTypeId;
    },
  },
};
