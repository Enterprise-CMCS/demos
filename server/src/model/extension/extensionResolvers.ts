import { Extension as PrismaExtension } from "@prisma/client";
import { prisma } from "../../prismaClient";
import {
  ApplicationStatus,
  ApplicationType,
  CreateExtensionInput,
  PhaseName,
  UpdateExtensionInput,
} from "../../types";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";
import {
  deleteApplication,
  resolveApplicationTags,
  resolveSuggestedApplicationTags,
} from "../application";
import { getDemonstration } from "../demonstration";
import { GraphQLContext } from "../../auth";
import { getExtension, getManyExtensions } from "./extensionData";
import { getManyDocuments } from "../document";
import { getManyApplicationPhases } from "../applicationPhase";

const extensionApplicationType: ApplicationType = "Extension";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";

export async function __createExtension(
  parent: unknown,
  { input }: { input: CreateExtensionInput }
): Promise<PrismaExtension> {
  return await prisma().$transaction(async (tx) => {
    const application = await tx.application.create({
      data: {
        applicationTypeId: extensionApplicationType,
      },
    });

    return await tx.extension.create({
      data: {
        id: application.id,
        applicationTypeId: application.applicationTypeId,
        demonstrationId: input.demonstrationId,
        name: input.name,
        description: input.description,
        statusId: newApplicationStatusId,
        currentPhaseId: conceptPhaseName,
        signatureLevelId: input.signatureLevel,
      },
    });
  });
}

export async function __updateExtension(
  parent: unknown,
  { id, input }: { id: string; input: UpdateExtensionInput }
): Promise<PrismaExtension> {
  const { effectiveDate } = parseAndValidateEffectiveAndExpirationDates(input);
  checkOptionalNotNullFields(["demonstrationId", "name", "status"], input);
  try {
    return await prisma().extension.update({
      where: {
        id: id,
      },
      data: {
        demonstrationId: input.demonstrationId,
        name: input.name,
        description: input.description,
        effectiveDate: effectiveDate,
        statusId: input.status,
        signatureLevelId: input.signatureLevel,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteExtension(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaExtension> {
  return await prisma().$transaction(async (tx) => {
    return await deleteApplication(id, "Extension", tx);
  });
}

export const extensionResolvers = {
  Query: {
    extension: (parent: unknown, args: { id: string }, context: GraphQLContext) =>
      getExtension({ id: args.id }, context.user),
    extensions: (parent: unknown, args: unknown, context: GraphQLContext) =>
      getManyExtensions({}, context.user),
  },

  Mutation: {
    createExtension: __createExtension,
    updateExtension: __updateExtension,
    deleteExtension: deleteExtension,
  },

  Extension: {
    demonstration: (parent: PrismaExtension, args: unknown, context: GraphQLContext) =>
      getDemonstration({ id: parent.demonstrationId }, context.user),
    documents: (parent: PrismaExtension, args: unknown, context: GraphQLContext) =>
      getManyDocuments({ applicationId: parent.id }, context.user),
    currentPhaseName: (parent: PrismaExtension) => parent.currentPhaseId,
    status: (parent: PrismaExtension) => parent.statusId,
    phases: (parent: PrismaExtension, args: unknown, context: GraphQLContext) =>
      getManyApplicationPhases({ applicationId: parent.id }, context.user),
    clearanceLevel: (parent: PrismaExtension) => parent.clearanceLevelId,
    tags: resolveApplicationTags,
    signatureLevel: (parent: PrismaExtension) => parent.signatureLevelId,
    suggestedApplicationTags: resolveSuggestedApplicationTags,
  },
};
