import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Document as PrismaDocument,
  ApplicationPhase as PrismaApplicationPhase,
} from "@prisma/client";
import { prisma } from "../../prismaClient";
import {
  ApplicationStatus,
  ApplicationType,
  ClearanceLevel,
  CreateAmendmentInput,
  PhaseName,
  SignatureLevel,
  Tag,
  TagStatus,
  UiPathResultStatus,
  UpdateAmendmentInput,
} from "../../types";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";
import { deleteApplication } from "../application";
import { getDemonstration } from "../demonstration";
import { GraphQLContext } from "../../auth";
import { getAmendment } from "./amendmentData";
import { getManyDocuments } from "../document";
import { selectManyApplicationTagAssignments } from "../applicationTagAssignment/queries";
import { selectManyApplicationTagSuggestions } from "../applicationTagSuggestion/queries";
import { selectManyApplicationPhases } from "../applicationPhase/queries";

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
        demonstrationStatusId: "Approved" satisfies ApplicationStatus,
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
  checkOptionalNotNullFields(["demonstrationId", "name"], input);
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
    amendment: (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ): Promise<PrismaAmendment> => getAmendment({ id: args.id }, context.user),
  },

  Mutation: {
    createAmendment: __createAmendment,
    updateAmendment: __updateAmendment,
    deleteAmendment: deleteAmendment,
  },

  Amendment: {
    demonstration: (
      parent: PrismaAmendment,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDemonstration> =>
      getDemonstration({ id: parent.demonstrationId }, context.user),
    documents: (
      parent: PrismaAmendment,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> => getManyDocuments({ applicationId: parent.id }, context.user),
    currentPhaseName: (parent: PrismaAmendment): PhaseName => parent.currentPhaseId as PhaseName,
    status: (parent: PrismaAmendment): ApplicationStatus => parent.statusId as ApplicationStatus,
    phases: (parent: PrismaAmendment): Promise<PrismaApplicationPhase[]> =>
      selectManyApplicationPhases({ applicationId: parent.id }),
    clearanceLevel: (parent: PrismaAmendment): ClearanceLevel =>
      parent.clearanceLevelId as ClearanceLevel,
    tags: async (parent: PrismaAmendment): Promise<Tag[]> =>
      (await selectManyApplicationTagAssignments({ applicationId: parent.id })).map(
        (assignment) => {
          const { statusId, tagNameId } = assignment.tag;
          return {
            tagName: tagNameId,
            approvalStatus: statusId as TagStatus,
          };
        }
      ),
    signatureLevel: (parent: PrismaAmendment): SignatureLevel =>
      parent.signatureLevelId as SignatureLevel,
    suggestedApplicationTags: async (parent: PrismaAmendment): Promise<string[]> =>
      (
        await selectManyApplicationTagSuggestions({
          applicationId: parent.id,
          statusId: {
            in: ["Pending" satisfies UiPathResultStatus],
          },
        })
      ).map((suggestion) => suggestion.value),
  },
};
