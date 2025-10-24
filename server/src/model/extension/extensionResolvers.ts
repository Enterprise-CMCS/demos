import { Extension } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { ApplicationStatus, ApplicationType, PhaseName } from "../../types.js";
import { CreateExtensionInput, UpdateExtensionInput } from "./extensionSchema.js";
import { resolveApplicationStatus } from "../applicationStatus/applicationStatusResolvers.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
} from "../applicationDate/checkInputDateFunctions.js";

const extensionApplicationType: ApplicationType = "Extension";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";

export async function getExtension(parent: undefined, { id }: { id: string }) {
  return await prisma().extension.findUnique({
    where: {
      id: id,
    },
  });
}

export async function getManyExtensions() {
  return await prisma().extension.findMany();
}

export async function createExtension(
  parent: undefined,
  { input }: { input: CreateExtensionInput }
) {
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

export async function updateExtension(
  parent: undefined,
  { id, input }: { id: string; input: UpdateExtensionInput }
) {
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

export async function deleteExtension(parent: undefined, { id }: { id: string }) {
  return await prisma().extension.delete({
    where: {
      id: id,
    },
  });
}

async function getParentDemonstration(parent: Extension) {
  return await prisma().demonstration.findUnique({
    where: { id: parent.demonstrationId },
  });
}

async function getDocuments(parent: Extension) {
  return await prisma().document.findMany({
    where: {
      applicationId: parent.id,
    },
  });
}

async function getCurrentPhase(parent: Extension) {
  return parent.currentPhaseId;
}

async function getPhases(parent: Extension) {
  return await prisma().applicationPhase.findMany({
    where: {
      applicationId: parent.id,
    },
  });
}

export const extensionResolvers = {
  Query: {
    extension: getExtension,
    extensions: getManyExtensions,
  },

  Mutation: {
    createExtension: createExtension,
    updateExtension: updateExtension,
    deleteExtension: deleteExtension,
  },

  Extension: {
    demonstration: getParentDemonstration,
    documents: getDocuments,
    currentPhaseName: getCurrentPhase,
    status: resolveApplicationStatus,
    phases: getPhases,
  },
};
