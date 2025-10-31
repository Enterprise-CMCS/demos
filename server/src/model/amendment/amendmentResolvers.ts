import { Amendment as PrismaAmendment, Demonstration as PrismaDemonstration } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import {
  ApplicationStatus,
  ApplicationType,
  CreateAmendmentInput,
  PhaseName,
  UpdateAmendmentInput,
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

const amendmentApplicationType: ApplicationType = "Amendment";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";

export async function __getAmendment(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaAmendment> {
  return await getApplication(id, "Amendment");
}

export async function __getManyAmendments(): Promise<PrismaAmendment[] | null> {
  return await getManyApplications("Amendment");
}

export async function __createAmendment(
  parent: unknown,
  { input }: { input: CreateAmendmentInput }
): Promise<PrismaAmendment> {
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

export async function __updateAmendment(
  parent: unknown,
  { id, input }: { id: string; input: UpdateAmendmentInput }
): Promise<PrismaAmendment> {
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

export async function __deleteAmendment(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaAmendment> {
  return await deleteApplication(id, "Amendment");
}

export async function __resolveParentDemonstration(
  parent: PrismaAmendment
): Promise<PrismaDemonstration> {
  // DB enforces that you cannot orphan the demonstration record
  const result = await prisma().demonstration.findUnique({
    where: { id: parent.demonstrationId },
  });
  return result!;
}

export const amendmentResolvers = {
  Query: {
    amendment: __getAmendment,
    amendments: __getManyAmendments,
  },

  Mutation: {
    createAmendment: __createAmendment,
    updateAmendment: __updateAmendment,
    deleteAmendment: __deleteAmendment,
  },

  Amendment: {
    demonstration: __resolveParentDemonstration,
    documents: resolveApplicationDocuments,
    currentPhaseName: resolveApplicationCurrentPhaseName,
    status: resolveApplicationStatus,
    phases: resolveApplicationPhases,
  },
};
