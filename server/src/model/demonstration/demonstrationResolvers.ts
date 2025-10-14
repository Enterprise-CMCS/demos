import { Demonstration } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { BundleType, PhaseName, BundleStatus, GrantLevel, Role } from "../../types.js";
import { CreateDemonstrationInput, UpdateDemonstrationInput } from "./demonstrationSchema.js";
import { resolveBundleStatus } from "../bundleStatus/bundleStatusResolvers.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
} from "../bundleDate/checkInputDateFunctions.js";

const grantLevelDemonstration: GrantLevel = "Demonstration";
const roleProjectOfficer: Role = "Project Officer";
const conceptPhaseName: PhaseName = "Concept";
const newBundleStatusId: BundleStatus = "Pre-Submission";
const demonstrationBundleType: BundleType = "Demonstration";
const amendmentBundleType: BundleType = "Amendment";
const extensionBundleType: BundleType = "Extension";

export async function getDemonstration(parent: undefined, { id }: { id: string }) {
  return await prisma().demonstration.findUnique({
    where: { id: id },
  });
}

export async function getManyDemonstrations() {
  return await prisma().demonstration.findMany();
}

export async function createDemonstration(
  parent: undefined,
  { input }: { input: CreateDemonstrationInput }
) {
  try {
    await prisma().$transaction(async (tx) => {
      const bundle = await tx.bundle.create({
        data: {
          bundleTypeId: demonstrationBundleType,
        },
      });

      await tx.demonstration.create({
        data: {
          id: bundle.id,
          bundleTypeId: bundle.bundleTypeId,
          name: input.name,
          description: input.description,
          sdgDivisionId: input.sdgDivision,
          signatureLevelId: input.signatureLevel,
          statusId: newBundleStatusId,
          stateId: input.stateId,
          currentPhaseId: conceptPhaseName,
        },
      });

      const person = await tx.person.findUnique({
        where: { id: input.projectOfficerUserId },
        select: { personTypeId: true },
      });

      if (!person) {
        throw new Error(`Person with id ${input.projectOfficerUserId} not found`);
      }

      await tx.demonstrationRoleAssignment.create({
        data: {
          demonstrationId: bundle.id,
          personId: input.projectOfficerUserId,
          personTypeId: person.personTypeId,
          roleId: roleProjectOfficer,
          stateId: input.stateId,
          grantLevelId: grantLevelDemonstration,
        },
      });

      await tx.primaryDemonstrationRoleAssignment.create({
        data: {
          demonstrationId: bundle.id,
          personId: input.projectOfficerUserId,
          roleId: "Project Officer",
        },
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: "Error creating demonstration: " + errorMessage,
    };
  }

  return {
    success: true,
    message: "Demonstration created successfully!",
  };
}

export async function updateDemonstration(
  parent: undefined,
  { id, input }: { id: string; input: UpdateDemonstrationInput }
) {
  if (input.effectiveDate) {
    checkInputDateIsStartOfDay({ dateType: "effectiveDate", dateValue: input.effectiveDate });
  }
  if (input.expirationDate) {
    checkInputDateIsEndOfDay({ dateType: "expirationDate", dateValue: input.expirationDate });
  }
  checkOptionalNotNullFields(
    ["name", "status", "currentPhaseName", "stateId", "projectOfficerUserId"],
    input
  );
  try {
    return await prisma().$transaction(async (tx) => {
      const demonstration = await tx.demonstration.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          effectiveDate: input.effectiveDate,
          expirationDate: input.expirationDate,
          sdgDivisionId: input.sdgDivision,
          signatureLevelId: input.signatureLevel,
          statusId: input.status,
          currentPhaseId: input.currentPhaseName,
          stateId: input.stateId,
        },
      });

      if (input.projectOfficerUserId) {
        const person = await tx.person.findUnique({
          where: { id: input.projectOfficerUserId },
          select: { personTypeId: true },
        });
        if (!person) {
          throw new Error(`Person with id ${input.projectOfficerUserId} not found`);
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

export const demonstrationResolvers = {
  Query: {
    demonstration: getDemonstration,
    demonstrations: getManyDemonstrations,
  },

  Mutation: {
    createDemonstration: createDemonstration,
    updateDemonstration: updateDemonstration,
    deleteDemonstration: async (_: undefined, { id }: { id: string }) => {
      return await prisma().demonstration.delete({
        where: { id: id },
      });
    },
  },

  Demonstration: {
    state: async (parent: Demonstration) => {
      return await prisma().state.findUnique({
        where: { id: parent.stateId },
      });
    },

    documents: async (parent: Demonstration) => {
      return await prisma().document.findMany({
        where: {
          bundleId: parent.id,
        },
      });
    },

    amendments: async (parent: Demonstration) => {
      return await prisma().modification.findMany({
        where: {
          demonstrationId: parent.id,
          bundleTypeId: amendmentBundleType,
        },
      });
    },

    extensions: async (parent: Demonstration) => {
      return await prisma().modification.findMany({
        where: {
          demonstrationId: parent.id,
          bundleTypeId: extensionBundleType,
        },
      });
    },

    sdgDivision: async (parent: Demonstration) => {
      return parent.sdgDivisionId;
    },

    signatureLevel: async (parent: Demonstration) => {
      return parent.signatureLevelId;
    },

    currentPhaseName: async (parent: Demonstration) => {
      return parent.currentPhaseId;
    },

    roles: async (parent: Demonstration) => {
      return await prisma().demonstrationRoleAssignment.findMany({
        where: { demonstrationId: parent.id },
      });
    },

    status: resolveBundleStatus,

    phases: async (parent: Demonstration) => {
      return await prisma().bundlePhase.findMany({
        where: {
          bundleId: parent.id,
        },
      });
    },

    primaryProjectOfficer: async (parent: Demonstration) => {
      const primaryRoleAssignment = await prisma().primaryDemonstrationRoleAssignment.findUnique({
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
      });

      if (!primaryRoleAssignment) {
        throw new Error(`No primary project officer found for demonstration with id ${parent.id}`);
      }

      return primaryRoleAssignment.demonstrationRoleAssignment.person;
    },
  },
};
