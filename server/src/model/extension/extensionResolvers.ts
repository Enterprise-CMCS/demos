import { Extension as PrismaExtension, Demonstration as PrismaDemonstration } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import {
  ApplicationStatus,
  ApplicationType,
  CreateExtensionInput,
  PhaseName,
  UpdateExtensionInput,
} from "../../types.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";
import {
  deleteApplication,
  getApplication,
  getManyApplications,
  resolveApplicationClearanceLevel,
  resolveApplicationCurrentPhaseName,
  resolveApplicationDocuments,
  resolveApplicationPhases,
  resolveApplicationStatus,
  resolveApplicationTags,
  resolveApplicationSignatureLevel,
} from "../application";

const extensionApplicationType: ApplicationType = "Extension";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";

export async function __getExtension(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaExtension> {
  return await getApplication(id, "Extension");
}

export async function __getManyExtensions(): Promise<PrismaExtension[]> {
  return await getManyApplications("Extension");
}

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

export async function __resolveParentDemonstration(
  parent: PrismaExtension
): Promise<PrismaDemonstration> {
  // DB enforces that you cannot orphan the demonstration record
  const result = await prisma().demonstration.findUnique({
    where: { id: parent.demonstrationId },
  });
  return result!;
}

export const extensionResolvers = {
  Query: {
    extension: __getExtension,
    extensions: __getManyExtensions,
  },

  Mutation: {
    createExtension: __createExtension,
    updateExtension: __updateExtension,
    deleteExtension: deleteExtension,
  },

  Extension: {
    demonstration: __resolveParentDemonstration,
    documents: resolveApplicationDocuments,
    currentPhaseName: resolveApplicationCurrentPhaseName,
    status: resolveApplicationStatus,
    phases: resolveApplicationPhases,
    clearanceLevel: resolveApplicationClearanceLevel,
    tags: resolveApplicationTags,
    signatureLevel: resolveApplicationSignatureLevel,
  },
};
