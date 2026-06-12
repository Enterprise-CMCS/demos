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
  UiPathResultStatus,
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
import { getManyAmendments } from "../amendment";
import { getManyExtensions } from "../extension";
import { getManyDocuments } from "../document";
import { selectManyApplicationPhases } from "../applicationPhase/queries";
import { selectManyApplicationTagAssignments } from "../applicationTagAssignment/queries";
import {
  selectDemonstrationTypeTagAssignment,
  selectManyDemonstrationTypeTagAssignments,
} from "../demonstrationTypeTagAssignment/queries";
import {
  selectDemonstrationRoleAssignmentOrThrow,
  selectManyDemonstrationRoleAssignments,
} from "../demonstrationRoleAssignment/queries";
import { selectManyApplicationTagSuggestions } from "../applicationTagSuggestion/queries";
import { selectPersonOrThrow } from "../person/queries";
import { selectStateOrThrow } from "../state/queries";
import { CHIP_DEMONSTRATION_TYPE_TAG_NAME } from "../../constants";

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
    state: (parent: PrismaDemonstration): Promise<PrismaState> =>
      selectStateOrThrow({ id: parent.stateId }),
    documents: (
      parent: PrismaDemonstration,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> => getManyDocuments({ applicationId: parent.id }, context.user),
    amendments: (
      parent: PrismaDemonstration,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaAmendment[]> =>
      getManyAmendments({ demonstrationId: parent.id }, context.user),
    extensions: (
      parent: PrismaDemonstration,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaExtension[]> =>
      getManyExtensions({ demonstrationId: parent.id }, context.user),
    sdgDivision: (parent: PrismaDemonstration): SdgDivision => parent.sdgDivisionId as SdgDivision,
    signatureLevel: (parent: PrismaDemonstration): SignatureLevel =>
      parent.signatureLevelId as SignatureLevel,
    currentPhaseName: (parent: PrismaDemonstration): PhaseName =>
      parent.currentPhaseId as PhaseName,
    roles: (parent: PrismaDemonstration): Promise<PrismaDemonstrationRoleAssignment[]> =>
      selectManyDemonstrationRoleAssignments({ demonstrationId: parent.id }),
    status: (parent: PrismaDemonstration): ApplicationStatus =>
      parent.statusId as ApplicationStatus,
    phases: (parent: PrismaDemonstration): Promise<PrismaApplicationPhase[]> =>
      selectManyApplicationPhases({ applicationId: parent.id }),
    primaryProjectOfficer: async (parent: PrismaDemonstration): Promise<PrismaPerson> => {
      const primaryProjectOfficerAssignment = await selectDemonstrationRoleAssignmentOrThrow({
        demonstrationId: parent.id,
        roleId: roleProjectOfficer,
        primaryDemonstrationRoleAssignment: {
          isNot: null,
        },
      });
      return selectPersonOrThrow({ id: primaryProjectOfficerAssignment.personId });
    },
    clearanceLevel: (parent: PrismaDemonstration): ClearanceLevel =>
      parent.clearanceLevelId as ClearanceLevel,
    tags: async (parent: PrismaDemonstration): Promise<Tag[]> =>
      (await selectManyApplicationTagAssignments({ applicationId: parent.id })).map(
        (assignment) => {
          const { statusId, tagNameId } = assignment.tag;
          return {
            tagName: tagNameId,
            approvalStatus: statusId as TagStatus,
          };
        }
      ),
    suggestedApplicationTags: async (parent: PrismaDemonstration): Promise<string[]> =>
      (
        await selectManyApplicationTagSuggestions({
          applicationId: parent.id,
          statusId: {
            in: ["Pending" satisfies UiPathResultStatus],
          },
        })
      ).map((suggestion) => suggestion.value),
    demonstrationTypes: async (
      parent: PrismaDemonstration
    ): Promise<DemonstrationTypeAssignment[]> =>
      (await selectManyDemonstrationTypeTagAssignments({ demonstrationId: parent.id })).map(
        (assignment) => {
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
        }
      ),
    deliverables: resolveManyDeliverables,
    chipId: async (parent: PrismaDemonstration): Promise<string | null> => {
      const chipDemonstrationType = await selectDemonstrationTypeTagAssignment({
        demonstrationId: parent.id,
        tagNameId: CHIP_DEMONSTRATION_TYPE_TAG_NAME,
      });
      if (chipDemonstrationType) {
        return parent.chipId;
      } else {
        return null;
      }
    },
  },
};
