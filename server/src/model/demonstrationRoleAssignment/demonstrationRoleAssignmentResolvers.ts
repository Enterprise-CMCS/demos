import { DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment } from "@prisma/client";

import { prisma } from "../../prismaClient.js";
import {
  SetDemonstrationRoleInput,
  UnsetDemonstrationRoleInput,
} from "./demonstrationRoleAssignmentSchema.js";

const DEMONSTRATION_GRANT_LEVEL = "Demonstration";

export async function unsetDemonstrationRoles(
  parent: undefined,
  { input }: { input: UnsetDemonstrationRoleInput[] }
) {
  return await prisma().$transaction(async (tx) => {
    const deletedRoles: PrismaDemonstrationRoleAssignment[] = [];

    for (const roleInput of input) {
      // Delete primary role assignment if it exists
      await tx.primaryDemonstrationRoleAssignment.deleteMany({
        where: {
          personId: roleInput.personId,
          demonstrationId: roleInput.demonstrationId,
          roleId: roleInput.roleId,
        },
      });

      // Delete main role assignment and collect the result
      const deletedRole = await tx.demonstrationRoleAssignment.delete({
        where: {
          personId_demonstrationId_roleId: {
            personId: roleInput.personId,
            demonstrationId: roleInput.demonstrationId,
            roleId: roleInput.roleId,
          },
        },
      });

      deletedRoles.push(deletedRole);
    }

    return deletedRoles;
  });
}

export async function setDemonstrationRole(
  parent: undefined,
  { input }: { input: SetDemonstrationRoleInput }
) {
  await prisma().$transaction(async (tx) => {
    const person = await tx.person.findUnique({
      where: { id: input.personId },
    });
    if (!person) {
      throw new Error(`Person with id ${input.personId} not found`);
    }

    const demonstration = await tx.demonstration.findUnique({
      where: { id: input.demonstrationId },
    });
    if (!demonstration) {
      throw new Error(`Demonstration with id ${input.demonstrationId} not found`);
    }

    await prisma().demonstrationRoleAssignment.upsert({
      where: {
        personId_demonstrationId_roleId: {
          personId: person.id,
          demonstrationId: demonstration.id,
          roleId: input.roleId,
        },
      },
      update: {},
      create: {
        roleId: input.roleId,
        demonstrationId: demonstration.id,
        stateId: demonstration.stateId,
        personId: person.id,
        personTypeId: person.personTypeId,
        grantLevelId: DEMONSTRATION_GRANT_LEVEL,
      },
    });

    if (input.isPrimary === true) {
      await prisma().primaryDemonstrationRoleAssignment.upsert({
        where: {
          demonstrationId_roleId: {
            demonstrationId: demonstration.id,
            roleId: input.roleId,
          },
        },
        update: {
          personId: person.id,
        },
        create: {
          demonstrationId: demonstration.id,
          personId: person.id,
          roleId: input.roleId,
        },
      });
    } else if (input.isPrimary === false) {
      await prisma().primaryDemonstrationRoleAssignment.deleteMany({
        where: {
          demonstrationId: demonstration.id,
          roleId: input.roleId,
          personId: person.id,
        },
      });
    }
  });
  return await prisma().demonstrationRoleAssignment.findUnique({
    where: {
      personId_demonstrationId_roleId: {
        personId: input.personId,
        demonstrationId: input.demonstrationId,
        roleId: input.roleId,
      },
    },
  });
}

export async function setDemonstrationRoles(
  parent: undefined,
  { input }: { input: SetDemonstrationRoleInput[] }
) {
  return await prisma().$transaction(async (tx) => {
    const results = [];

    for (const roleInput of input) {
      const person = await tx.person.findUnique({
        where: { id: roleInput.personId },
      });
      if (!person) {
        throw new Error(`Person with id ${roleInput.personId} not found`);
      }

      const demonstration = await tx.demonstration.findUnique({
        where: { id: roleInput.demonstrationId },
      });
      if (!demonstration) {
        throw new Error(`Demonstration with id ${roleInput.demonstrationId} not found`);
      }

      // Create or update the role assignment
      await tx.demonstrationRoleAssignment.upsert({
        where: {
          personId_demonstrationId_roleId: {
            personId: person.id,
            demonstrationId: demonstration.id,
            roleId: roleInput.roleId,
          },
        },
        update: {},
        create: {
          roleId: roleInput.roleId,
          demonstrationId: demonstration.id,
          stateId: demonstration.stateId,
          personId: person.id,
          personTypeId: person.personTypeId,
          grantLevelId: DEMONSTRATION_GRANT_LEVEL,
        },
      });

      // Handle primary assignment
      if (roleInput.isPrimary === true) {
        await tx.primaryDemonstrationRoleAssignment.upsert({
          where: {
            demonstrationId_roleId: {
              demonstrationId: demonstration.id,
              roleId: roleInput.roleId,
            },
          },
          update: {
            personId: person.id,
          },
          create: {
            demonstrationId: demonstration.id,
            personId: person.id,
            roleId: roleInput.roleId,
          },
        });
      } else if (roleInput.isPrimary === false) {
        await tx.primaryDemonstrationRoleAssignment.deleteMany({
          where: {
            demonstrationId: demonstration.id,
            roleId: roleInput.roleId,
            personId: person.id,
          },
        });
      }

      // Fetch the created/updated role assignment
      const result = await tx.demonstrationRoleAssignment.findUnique({
        where: {
          personId_demonstrationId_roleId: {
            personId: roleInput.personId,
            demonstrationId: roleInput.demonstrationId,
            roleId: roleInput.roleId,
          },
        },
        include: {
          person: true,
          demonstration: true,
          primaryDemonstrationRoleAssignment: true,
        },
      });

      if (result) {
        results.push(result);
      }
    }

    return results;
  });
}

export const demonstrationRoleAssigmentResolvers = {
  Mutation: {
    setDemonstrationRole,
    setDemonstrationRoles,
    unsetDemonstrationRoles,
  },

  DemonstrationRoleAssignment: {
    person: async (parent: PrismaDemonstrationRoleAssignment) => {
      return await prisma().person.findUnique({
        where: { id: parent.personId },
      });
    },
    role: async (parent: PrismaDemonstrationRoleAssignment) => {
      return parent.roleId;
    },
    demonstration: async (parent: PrismaDemonstrationRoleAssignment) => {
      return await prisma().demonstration.findUnique({
        where: { id: parent.demonstrationId },
      });
    },
    isPrimary: async (parent: PrismaDemonstrationRoleAssignment) => {
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
