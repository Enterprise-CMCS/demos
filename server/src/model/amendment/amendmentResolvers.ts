import { Demonstration, Prisma, Amendment as PrismaAmendment } from "@prisma/client";
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
import { deleteApplication, getApplication, getManyApplications } from "../application";
import { getDocuments } from "../document/documentResolvers.js";
import { getApplicationPhases } from "../applicationPhase/applicationPhaseResolvers.js";
import { GraphQLContext } from "../../auth/auth.util.js";
import { GraphQLResolveInfo } from "graphql";
import { getCurrentPhaseName } from "../phase/phaseSchema.js";
import { getApplicationTags } from "../tag/tagResolvers.js";
import { getDemonstration } from "../demonstration/demonstrationResolvers.js";

const amendmentApplicationType: ApplicationType = "Amendment";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";

export async function getAmendments(
  parent: Demonstration,
  args: unknown,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<PrismaAmendment[]> {
  const parentType = info.parentType.name;
  let filter: Prisma.AmendmentWhereInput;
  switch (parentType) {
    case Prisma.ModelName.Demonstration:
      filter = {
        demonstrationId: (parent as Extract<typeof parent, Demonstration>).id,
      };
      break;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  try {
    return await prisma().amendment.findMany({
      where: { ...filter },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function __getAmendment(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaAmendment> {
  return await getApplication(id, { applicationTypeId: "Amendment" });
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
    demonstration: getDemonstration,
    documents: getDocuments,
    currentPhaseName: (parent: PrismaAmendment) => parent.currentPhaseId,
    status: (parent: PrismaAmendment) => parent.statusId,
    phases: getApplicationPhases,
    clearanceLevel: (parent: PrismaAmendment) => parent.clearanceLevelId,
    tags: getApplicationTags,
    signatureLevel: (parent: PrismaAmendment) => parent.signatureLevelId,
  },
};
