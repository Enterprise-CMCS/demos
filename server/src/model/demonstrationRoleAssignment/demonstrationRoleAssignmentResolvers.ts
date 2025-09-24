import { DemonstrationRoleAssignment } from "@prisma/client";

import { prisma } from "../../prismaClient.js";
import { AssignDemonstrationRoleInput } from "./demonstrationRoleAssignmentSchema.js";

const DEMONSTRATION_GRANT_LEVEL = "Demonstration";

export async function assignDemonstrationRole(
  parent: undefined,
  { input }: { input: AssignDemonstrationRoleInput }
) {
  const person = await prisma().person.findUnique({
    where: { id: input.personId },
  });
  if (!person) {
    throw new Error(`Person with id ${input.personId} not found`);
  }

  const demonstration = await prisma().demonstration.findUnique({
    where: { id: input.demonstrationId },
  });
  if (!demonstration) {
    throw new Error(`Demonstration with id ${input.demonstrationId} not found`);
  }

  const demonstrationRoleAssignment = await prisma().demonstrationRoleAssignment.create({
    data: {
      demonstrationId: demonstration.id,
      stateId: demonstration.stateId,
      personId: person.id,
      personTypeId: person.personTypeId,
      roleId: input.roleId,
      grantLevelId: DEMONSTRATION_GRANT_LEVEL,
    },
  });

  if (input.isPrimary) {
    await prisma().primaryDemonstrationRoleAssignment.create({
      data: {
        personId: input.personId,
        roleId: input.roleId,
        demonstrationId: input.demonstrationId,
      },
    });
  }

  return demonstrationRoleAssignment;
}

export const demonstrationRoleAssigmentResolvers = {
  Mutation: {
    assignDemonstrationRole: assignDemonstrationRole,
  },

  DemonstrationRoleAssignment: {
    person: async (parent: DemonstrationRoleAssignment) => {
      return await prisma().person.findUnique({
        where: { id: parent.personId },
      });
    },
    role: async (parent: DemonstrationRoleAssignment) => {
      return parent.roleId;
    },
    demonstration: async (parent: DemonstrationRoleAssignment) => {
      return await prisma().demonstration.findUnique({
        where: { id: parent.demonstrationId },
      });
    },
    isPrimary: async (parent: DemonstrationRoleAssignment) => {
      return !!(await prisma().primaryDemonstrationRoleAssignment.findUnique({
        where: {
          personId_demonstrationId_roleId: {
            personId: parent.personId,
            demonstrationId: parent.demonstrationId,
            roleId: parent.roleId,
          },
        },
      }));
    },
  },
};
