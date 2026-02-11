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
} from "../application";
import {
  resolveApplicationSdgDivision,
  resolveApplicationSignatureLevel,
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

export async function __getManyAmendments(): Promise<PrismaAmendment[]> {
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
        sdgDivisionId: input.sdgDivision,
        signatureLevelId: input.signatureLevel,
      },
    });
  });
}

export async function __updateAmendment(
  parent: unknown,
  { id, input }: { id: string; input: UpdateAmendmentInput }
): Promise<PrismaAmendment> {
  const { effectiveDate } = parseAndValidateEffectiveAndExpirationDates(input);
  checkOptionalNotNullFields(["demonstrationId", "name", "status"], input);
  try {
    return await prisma().amendment.update({
      where: {
        id: id,
      },
      data: {
        demonstrationId: input.demonstrationId,
        name: input.name,
        description: input.description,
        effectiveDate: effectiveDate,
        statusId: input.status,
        sdgDivisionId: input.sdgDivision,
        signatureLevelId: input.signatureLevel,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteAmendment(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaAmendment> {
  return await prisma().$transaction(async (tx) => {
    return await deleteApplication(id, "Amendment", tx);
  });
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
    deleteAmendment: deleteAmendment,
  },

  Amendment: {
    demonstration: __resolveParentDemonstration,
    documents: resolveApplicationDocuments,
    currentPhaseName: resolveApplicationCurrentPhaseName,
    status: resolveApplicationStatus,
    phases: resolveApplicationPhases,
    clearanceLevel: resolveApplicationClearanceLevel,
    tags: resolveApplicationTags,
    sdgDivision: resolveApplicationSdgDivision,
    signatureLevel: resolveApplicationSignatureLevel,
  },
};
