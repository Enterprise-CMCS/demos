import {
  ApplicationPhase as PrismaApplicationPhase,
  Demonstration as PrismaDemonstration,
  Document as PrismaDocument,
  Extension as PrismaExtension,
} from "@prisma/client";
import { prisma } from "../../prismaClient";
import {
  ApplicationStatus,
  ClearanceLevel,
  CreateExtensionInput,
  PhaseName,
  SignatureLevel,
  Tag,
  TagStatus,
  UiPathResultStatus,
  UpdateExtensionInput,
} from "../../types";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";
import { deleteApplication } from "../application";
import { getDemonstration } from "../demonstration";
import { GraphQLContext } from "../../auth";
import { getExtension } from "./extensionData";
import { getManyDocuments } from "../document";
import { selectManyApplicationPhases } from "../applicationPhase/queries";
import { selectManyApplicationTagAssignments } from "../applicationTagAssignment/queries";
import { selectManyApplicationTagSuggestions } from "../applicationTagSuggestion/queries";
import { createExtension } from ".";

export async function __updateExtension(
  parent: unknown,
  { id, input }: { id: string; input: UpdateExtensionInput }
): Promise<PrismaExtension> {
  const { effectiveDate } = parseAndValidateEffectiveAndExpirationDates(input);
  checkOptionalNotNullFields(["demonstrationId", "name"], input);
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
    extension: (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ): Promise<PrismaExtension> => getExtension({ id: args.id }, context.user),
  },

  Mutation: {
    createExtension: (parent: unknown, args: { input: CreateExtensionInput }) =>
      createExtension({
        demonstrationId: args.input.demonstrationId,
        name: args.input.name,
        description: args.input.description,
        signatureLevelId: args.input.signatureLevel,
      }),
    updateExtension: __updateExtension,
    deleteExtension: deleteExtension,
  },

  Extension: {
    demonstration: (
      parent: PrismaExtension,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDemonstration> =>
      getDemonstration({ id: parent.demonstrationId }, context.user),
    documents: (
      parent: PrismaExtension,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> => getManyDocuments({ applicationId: parent.id }, context.user),
    currentPhaseName: (parent: PrismaExtension): PhaseName => parent.currentPhaseId as PhaseName,
    status: (parent: PrismaExtension): ApplicationStatus => parent.statusId as ApplicationStatus,
    phases: (parent: PrismaExtension): Promise<PrismaApplicationPhase[]> =>
      selectManyApplicationPhases({ applicationId: parent.id }),
    clearanceLevel: (parent: PrismaExtension): ClearanceLevel =>
      parent.clearanceLevelId as ClearanceLevel,
    tags: async (parent: PrismaExtension): Promise<Tag[]> =>
      (await selectManyApplicationTagAssignments({ applicationId: parent.id })).map(
        (assignment) => {
          const { statusId, tagNameId } = assignment.tag;
          return {
            tagName: tagNameId,
            approvalStatus: statusId as TagStatus,
          };
        }
      ),
    signatureLevel: (parent: PrismaExtension): SignatureLevel =>
      parent.signatureLevelId as SignatureLevel,
    suggestedApplicationTags: async (parent: PrismaExtension): Promise<string[]> =>
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
