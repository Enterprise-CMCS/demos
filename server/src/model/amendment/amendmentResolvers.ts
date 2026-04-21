import { Amendment as PrismaAmendment } from "@prisma/client";
import { prisma } from "../../prismaClient";
import {
  ApplicationStatus,
  ApplicationType,
  CreateAmendmentInput,
  PhaseName,
  UpdateAmendmentInput,
} from "../../types";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";
<<<<<<< HEAD
import { deleteApplication, resolveSuggestedApplicationTags } from "../application";
=======
import {
  deleteApplication,
  resolveApplicationTags,
  resolveSuggestedApplicationTags,
} from "../application";
>>>>>>> 40e2d189b898434185f192ee1a65ea5c481cb389
import { getDemonstration } from "../demonstration";
import { GraphQLContext } from "../../auth";
import { getAmendment, getManyAmendments } from "./amendmentData";
import { getManyDocuments } from "../document";
import { getManyApplicationPhases } from "../applicationPhase";
<<<<<<< HEAD
import { getManyApplicationTagAssignments } from "../applicationTagAssignment";
=======
>>>>>>> 40e2d189b898434185f192ee1a65ea5c481cb389

const amendmentApplicationType: ApplicationType = "Amendment";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";

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
    amendment: (parent: unknown, args: { id: string }, context: GraphQLContext) =>
      getAmendment({ id: args.id }, context.user),
    amendments: (parent: unknown, args: unknown, context: GraphQLContext) =>
      getManyAmendments({}, context.user),
  },

  Mutation: {
    createAmendment: __createAmendment,
    updateAmendment: __updateAmendment,
    deleteAmendment: deleteAmendment,
  },

  Amendment: {
    demonstration: (parent: PrismaAmendment, args: unknown, context: GraphQLContext) =>
      getDemonstration({ id: parent.demonstrationId }, context.user),
    documents: (parent: PrismaAmendment, args: unknown, context: GraphQLContext) =>
      getManyDocuments({ applicationId: parent.id }, context.user),
    currentPhaseName: (parent: PrismaAmendment) => parent.currentPhaseId,
    status: (parent: PrismaAmendment) => parent.statusId,
    phases: (parent: PrismaAmendment, args: unknown, context: GraphQLContext) =>
      getManyApplicationPhases({ applicationId: parent.id }, context.user),
    clearanceLevel: (parent: PrismaAmendment) => parent.clearanceLevelId,
    tags: async (parent: PrismaAmendment, args: unknown, context: GraphQLContext) =>
      (await getManyApplicationTagAssignments({ applicationId: parent.id }, context.user)).map(
        (assignment) => {
          const { statusId, tagNameId, ...tag } = assignment.tag;
          return {
            ...tag,
            tagName: tagNameId,
            approvalStatus: statusId,
          };
        }
      ),
    signatureLevel: (parent: PrismaAmendment) => parent.signatureLevelId,
    suggestedApplicationTags: resolveSuggestedApplicationTags,
  },
};
