import {
  Amendment as PrismaAmendment,
  ApplicationPhase as PrismaApplicationPhase,
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
  Document as PrismaDocument,
  Extension as PrismaExtension,
  Demonstration as PrismaDemonstration,
  Person as PrismaPerson,
  State as PrismaState,
} from "@prisma/client";
import { prisma } from "../../prismaClient";
import {
  ApplicationStatus,
  ApplicationType,
  ClearanceLevel,
  CreateDemonstrationInput,
  DemonstrationTypeAssignment,
  GrantLevel,
  PhaseName,
  Role,
  SdgDivision,
  SignatureLevel,
  Tag,
  TagStatus,
  UpdateDemonstrationInput,
} from "../../types";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";
import { deleteApplication, getApplication } from "../application";
import { determineDemonstrationTypeStatus } from "./determineDemonstrationTypeStatus";
import { resolveManyDeliverables } from "../deliverable";
import { GraphQLContext } from "../../auth";
import { getDemonstration, getManyDemonstrations } from "./demonstrationData";
import { CHIP_DEMONSTRATION_TYPE_TAG_NAME } from "../../constants";
import { requireLoaders } from "../../loaders";

const grantLevelDemonstration: GrantLevel = "Demonstration";
const roleProjectOfficer: Role = "Project Officer";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";
const demonstrationApplicationType: ApplicationType = "Demonstration";

const DEFAULT_SIGNATURE_LEVEL: SignatureLevel = "OA";

export async function __createDemonstration(
  parent: unknown,
  { input }: { input: CreateDemonstrationInput }
): Promise<PrismaDemonstration> {
  let newApplicationId: string;
  try {
    newApplicationId = await prisma().$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          applicationTypeId: demonstrationApplicationType,
        },
      });

      await tx.demonstration.create({
        data: {
          id: application.id,
          applicationTypeId: application.applicationTypeId,
          name: input.name.trim(),
          description: input.description?.trim(),
          sdgDivisionId: input.sdgDivision,
          signatureLevelId: DEFAULT_SIGNATURE_LEVEL,
          statusId: newApplicationStatusId,
          stateId: input.stateId,
          currentPhaseId: conceptPhaseName,
        },
      });

      const person = await tx.person.findUnique({
        where: { id: input.projectOfficerUserId },
        select: { personTypeId: true },
      });

      if (!person) {
        throw new Error(`Person with id ${input.projectOfficerUserId} not found.`);
      }

      await tx.demonstrationRoleAssignment.create({
        data: {
          demonstrationId: application.id,
          personId: input.projectOfficerUserId,
          personTypeId: person.personTypeId,
          roleId: roleProjectOfficer,
          stateId: input.stateId,
          grantLevelId: grantLevelDemonstration,
        },
      });

      await tx.primaryDemonstrationRoleAssignment.create({
        data: {
          demonstrationId: application.id,
          personId: input.projectOfficerUserId,
          roleId: roleProjectOfficer,
        },
      });

      return application.id;
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(newApplicationId, { applicationTypeId: "Demonstration" });
}

export async function __updateDemonstration(
  parent: unknown,
  { id, input }: { id: string; input: UpdateDemonstrationInput }
): Promise<PrismaDemonstration> {
  const { effectiveDate, expirationDate } = parseAndValidateEffectiveAndExpirationDates(input);
  checkOptionalNotNullFields(["name", "projectOfficerUserId"], input);
  try {
    return await prisma().$transaction(async (tx) => {
      const demonstration = await tx.demonstration.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          description: input.description?.trim(),
          effectiveDate: effectiveDate,
          expirationDate: expirationDate,
          sdgDivisionId: input.sdgDivision,
        },
      });

      if (input.projectOfficerUserId) {
        const person = await tx.person.findUnique({
          where: { id: input.projectOfficerUserId },
          select: { personTypeId: true },
        });
        if (!person) {
          throw new Error(`Person with id ${input.projectOfficerUserId} not found.`);
        }

        await tx.demonstrationRoleAssignment.upsert({
          where: {
            personId_demonstrationId_roleId: {
              demonstrationId: id,
              personId: input.projectOfficerUserId,
              roleId: roleProjectOfficer,
            },
          },
          update: {},
          create: {
            demonstrationId: id,
            personId: input.projectOfficerUserId,
            personTypeId: person.personTypeId,
            roleId: roleProjectOfficer,
            stateId: demonstration.stateId,
            grantLevelId: grantLevelDemonstration,
          },
        });

        await tx.primaryDemonstrationRoleAssignment.upsert({
          where: {
            demonstrationId_roleId: {
              demonstrationId: id,
              roleId: roleProjectOfficer,
            },
          },
          update: {
            personId: input.projectOfficerUserId,
          },
          create: {
            demonstrationId: id,
            personId: input.projectOfficerUserId,
            roleId: roleProjectOfficer,
          },
        });
      }

      return demonstration;
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteDemonstration(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaDemonstration> {
  return await prisma().$transaction(async (tx) => {
    return await deleteApplication(id, "Demonstration", tx);
  });
}

export async function __resolveDemonstrationPrimaryProjectOfficer(
  parent: PrismaDemonstration
): Promise<PrismaPerson> {
  // It is not possible in the DB for the primary project officer not to exist
  const primaryRoleAssignment = await prisma().primaryDemonstrationRoleAssignment.findUniqueOrThrow(
    {
      where: {
        demonstrationId_roleId: {
          demonstrationId: parent.id,
          roleId: roleProjectOfficer,
        },
      },
      include: {
        demonstrationRoleAssignment: {
          include: { person: true },
        },
      },
    }
  );
  return primaryRoleAssignment.demonstrationRoleAssignment.person;
}

export const demonstrationResolvers = {
  Query: {
    demonstration: (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ): Promise<PrismaDemonstration> => getDemonstration({ id: args.id }, context.user),
    demonstrations: (
      parent: unknown,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDemonstration[]> => getManyDemonstrations({}, context.user),
  },

  Mutation: {
    createDemonstration: __createDemonstration,
    updateDemonstration: __updateDemonstration,
    deleteDemonstration: deleteDemonstration,
  },

  Demonstration: {
    state: async (
      parent: PrismaDemonstration,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaState> => {
      const state = await requireLoaders(context).stateById.load(parent.stateId);
      if (!state) {
        throw new Error("No state found matching the provided filter");
      }
      return state;
    },
    documents: (
      parent: PrismaDemonstration,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> =>
      requireLoaders(context).documentsByApplicationId.load(parent.id),
    amendments: (
      parent: PrismaDemonstration,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaAmendment[]> =>
      requireLoaders(context).amendmentsByDemonstrationId.load(parent.id),
    extensions: (
      parent: PrismaDemonstration,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaExtension[]> =>
      requireLoaders(context).extensionsByDemonstrationId.load(parent.id),
    sdgDivision: (parent: PrismaDemonstration): SdgDivision => parent.sdgDivisionId as SdgDivision,
    signatureLevel: (parent: PrismaDemonstration): SignatureLevel =>
      parent.signatureLevelId as SignatureLevel,
    currentPhaseName: (parent: PrismaDemonstration): PhaseName =>
      parent.currentPhaseId as PhaseName,
    roles: (
      parent: PrismaDemonstration,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDemonstrationRoleAssignment[]> =>
      requireLoaders(context).rolesByDemonstrationId.load(parent.id),
    status: (parent: PrismaDemonstration): ApplicationStatus =>
      parent.statusId as ApplicationStatus,
    phases: (
      parent: PrismaDemonstration,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaApplicationPhase[]> =>
      requireLoaders(context).phasesByApplicationId.load(parent.id),
    primaryProjectOfficer: async (
      parent: PrismaDemonstration,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaPerson> => {
      const loaders = requireLoaders(context);
      const [primaryProjectOfficerAssignment] =
        await loaders.primaryProjectOfficerAssignmentsByDemonstrationId.load(parent.id);
      if (!primaryProjectOfficerAssignment) {
        throw new Error("No demonstrationRoleAssignment found matching the provided filter");
      }
      const person = await loaders.personById.load(primaryProjectOfficerAssignment.personId);
      if (!person) {
        throw new Error("No person found matching the provided filter");
      }
      return person;
    },
    clearanceLevel: (parent: PrismaDemonstration): ClearanceLevel =>
      parent.clearanceLevelId as ClearanceLevel,
    tags: async (
      parent: PrismaDemonstration,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Tag[]> =>
      (await requireLoaders(context).tagAssignmentsByApplicationId.load(parent.id)).map(
        (assignment) => {
          const { statusId, tagNameId } = assignment.tag;
          return {
            tagName: tagNameId,
            approvalStatus: statusId as TagStatus,
          };
        }
      ),
    suggestedApplicationTags: async (
      parent: PrismaDemonstration,
      _args: unknown,
      context: GraphQLContext
    ): Promise<string[]> =>
      (await requireLoaders(context).suggestedTagsByApplicationId.load(parent.id)).map(
        (suggestion) => suggestion.value
      ),
    demonstrationTypes: async (
      parent: PrismaDemonstration,
      _args: unknown,
      context: GraphQLContext
    ): Promise<DemonstrationTypeAssignment[]> =>
      (
        await requireLoaders(context).demonstrationTypeAssignmentsByDemonstrationId.load(parent.id)
      ).map((assignment) => {
        const { tagNameId, tag, ...rest } = assignment;
        return {
          ...rest,
          demonstrationTypeName: tagNameId,
          status: determineDemonstrationTypeStatus(
            assignment.effectiveDate,
            assignment.expirationDate
          ),
          approvalStatus: tag.statusId as TagStatus,
        };
      }),
    deliverables: resolveManyDeliverables,
    chipId: async (
      parent: PrismaDemonstration,
      _args: unknown,
      context: GraphQLContext
    ): Promise<string | null> => {
      const demonstrationTypeAssignments = await requireLoaders(
        context
      ).demonstrationTypeAssignmentsByDemonstrationId.load(parent.id);
      const hasChipDemonstrationType = demonstrationTypeAssignments.some(
        (assignment) => assignment.tagNameId === CHIP_DEMONSTRATION_TYPE_TAG_NAME
      );
      return hasChipDemonstrationType ? parent.chipId : null;
    },
  },
};
