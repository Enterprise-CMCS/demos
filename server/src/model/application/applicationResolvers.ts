import { prisma } from "../../prismaClient.js";
import { GraphQLError } from "graphql";
import { ApplicationType, ClearanceLevel } from "../../types.js";
import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
  Document as PrismaDocument,
  ApplicationPhase as PrismaApplicationPhase,
} from "@prisma/client";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { SetApplicationClearanceLevelInput } from "./applicationSchema.js";
import { getFinishedApplicationPhaseIds } from "../applicationPhase";

export type PrismaApplication = PrismaDemonstration | PrismaAmendment | PrismaExtension;

type FindApplicationQueryResult = {
  id: string;
  applicationTypeId: string;
  demonstration: PrismaDemonstration | null;
  amendment: PrismaAmendment | null;
  extension: PrismaExtension | null;
};

export async function getApplication(
  applicationId: string,
  applicationTypeId: "Demonstration"
): Promise<PrismaDemonstration>;

export async function getApplication(
  applicationId: string,
  applicationTypeId: "Amendment"
): Promise<PrismaAmendment>;

export async function getApplication(
  applicationId: string,
  applicationTypeId: "Extension"
): Promise<PrismaExtension>;

export async function getApplication(applicationId: string): Promise<PrismaApplication>;

export async function getApplication(
  applicationId: string,
  applicationTypeId?: ApplicationType
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

export async function deleteApplication(
  applicationId: string,
  applicationTypeId: "Demonstration"
): Promise<PrismaDemonstration>;

export async function deleteApplication(
  applicationId: string,
  applicationTypeId: "Amendment"
): Promise<PrismaAmendment>;

export async function deleteApplication(
  applicationId: string,
  applicationTypeId: "Extension"
): Promise<PrismaExtension>;

export async function deleteApplication(
  applicationId: string,
  applicationTypeId: ApplicationType
): Promise<PrismaApplication> {
  try {
    return await prisma().$transaction(async (tx) => {
      await tx.application.delete({
        where: {
          id: applicationId,
        },
      });

      switch (applicationTypeId) {
        case "Demonstration":
          return await tx.demonstration.delete({
            where: {
              id: applicationId,
            },
          });
        case "Amendment":
          return await tx.amendment.delete({
            where: {
              id: applicationId,
            },
          });
        case "Extension":
          return await tx.extension.delete({
            where: {
              id: applicationId,
            },
          });
      }
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

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

export function __resolveApplicationType(parent: PrismaApplication): string {
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

export async function setApplicationClearanceLevel(
  _: unknown,
  { input }: { input: SetApplicationClearanceLevelInput }
): Promise<PrismaApplication> {
  try {
    const application = await getApplication(input.applicationId);
    const applicationType = __resolveApplicationType(application);

    return await prisma().$transaction(async (tx) => {
      const finishedApplicationPhaseIds = await getFinishedApplicationPhaseIds(
        tx,
        input.applicationId
      );

      if (finishedApplicationPhaseIds.find((phase) => phase === "Review")) {
        throw new Error("Cannot change clearance level after the Review phase has been completed.");
      }

      switch (applicationType) {
        case "Demonstration":
          return await tx.demonstration.update({
            where: { id: input.applicationId },
            data: { clearanceLevelId: input.clearanceLevel },
          });
        case "Amendment":
          return await tx.amendment.update({
            where: { id: input.applicationId },
            data: { clearanceLevelId: input.clearanceLevel },
          });
        case "Extension":
          return await tx.extension.update({
            where: { id: input.applicationId },
            data: { clearanceLevelId: input.clearanceLevel },
          });
        default:
          throw new GraphQLError(`Unknown application type: ${applicationType}`);
      }
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export const applicationResolvers = {
  Mutation: {
    setApplicationClearanceLevel: setApplicationClearanceLevel,
  },
  Application: {
    __resolveType: __resolveApplicationType,
  },
};
