import { Amendment } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { ApplicationStatus, ApplicationType, PhaseName } from "../../types.js";
import { CreateAmendmentInput, UpdateAmendmentInput } from "./amendmentSchema.js";
import { resolveApplicationStatus } from "../applicationStatus/applicationStatusResolvers.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
} from "../applicationDate/checkInputDateFunctions.js";

const amendmentApplicationType: ApplicationType = "Amendment";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";

export async function getAmendment(parent: undefined, { id }: { id: string }) {
  return await prisma().amendment.findUnique({
    where: {
      id: id,
    },
  });
}

export async function getManyAmendments() {
  return await prisma().amendment.findMany();
}

export async function createAmendment(
  parent: undefined,
  { input }: { input: CreateAmendmentInput }
) {
  return await prisma().$transaction(async (tx) => {
    const application = await tx.application.create({
      data: {
        applicationTypeId: amendmentApplicationType,
      },
    });

    return await tx.amendment.create({
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

export async function updateAmendment(
  parent: undefined,
  { id, input }: { id: string; input: UpdateAmendmentInput }
) {
  if (input.effectiveDate) {
    checkInputDateIsStartOfDay({ dateType: "effectiveDate", dateValue: input.effectiveDate });
  }
  if (input.expirationDate) {
    checkInputDateIsEndOfDay({ dateType: "expirationDate", dateValue: input.expirationDate });
  }
  checkOptionalNotNullFields(["demonstrationId", "name", "status", "currentPhaseName"], input);
  try {
    return await prisma().amendment.update({
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

export async function deleteAmendment(parent: undefined, { id }: { id: string }) {
  return await prisma().amendment.delete({
    where: {
      id: id,
    },
  });
}

async function getParentDemonstration(parent: Amendment) {
  return await prisma().demonstration.findUnique({
    where: { id: parent.demonstrationId },
  });
}

async function getDocuments(parent: Amendment) {
  return await prisma().document.findMany({
    where: {
      applicationId: parent.id,
    },
  });
}

async function getCurrentPhase(parent: Amendment) {
  return parent.currentPhaseId;
}

async function getPhases(parent: Amendment) {
  return await prisma().applicationPhase.findMany({
    where: {
      applicationId: parent.id,
    },
  });
}

export const amendmentResolvers = {
  Query: {
    amendment: getAmendment,
    amendments: getManyAmendments,
  },

  Mutation: {
    createAmendment: createAmendment,
    updateAmendment: updateAmendment,
    deleteAmendment: deleteAmendment,
  },

  Amendment: {
    demonstration: getParentDemonstration,
    documents: getDocuments,
    currentPhaseName: getCurrentPhase,
    status: resolveApplicationStatus,
    phases: getPhases,
  },
};
