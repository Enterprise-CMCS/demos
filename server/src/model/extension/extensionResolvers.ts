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
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
} from "../applicationDate/checkInputDateFunctions.js";
import {
  deleteApplication,
  getApplication,
  getManyApplications,
  resolveApplicationCurrentPhaseName,
  resolveApplicationDocuments,
  resolveApplicationPhases,
  resolveApplicationStatus,
} from "../application/applicationResolvers.js";

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
      },
    });
  });
}

export async function __updateExtension(
  parent: unknown,
  { id, input }: { id: string; input: UpdateExtensionInput }
): Promise<PrismaExtension> {
  if (input.effectiveDate) {
    checkInputDateIsStartOfDay({ dateType: "effectiveDate", dateValue: input.effectiveDate });
  }
  if (input.expirationDate) {
    checkInputDateIsEndOfDay({ dateType: "expirationDate", dateValue: input.expirationDate });
  }
  checkOptionalNotNullFields(["demonstrationId", "name", "status", "currentPhaseName"], input);
  try {
    return await prisma().extension.update({
      where: {
        id: id,
      },
      data: {
        demonstrationId: input.demonstrationId,
        name: input.name,
        description: input.description,
        effectiveDate: input.effectiveDate,
        expirationDate: input.expirationDate,
        statusId: input.status,
        currentPhaseId: input.currentPhaseName,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function __deleteExtension(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaExtension> {
  return await deleteApplication(id, "Extension");
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
    deleteExtension: __deleteExtension,
  },

  Extension: {
    demonstration: __resolveParentDemonstration,
    documents: resolveApplicationDocuments,
    currentPhaseName: resolveApplicationCurrentPhaseName,
    status: resolveApplicationStatus,
    phases: resolveApplicationPhases,
  },
};
