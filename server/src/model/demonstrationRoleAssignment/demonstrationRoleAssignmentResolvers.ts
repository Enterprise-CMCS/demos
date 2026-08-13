import {
  Demonstration,
  Person,
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
} from "@prisma/client";

import { prisma } from "../../prismaClient";
import {
  SetDemonstrationRoleInput,
  UnsetDemonstrationRoleInput,
} from "./demonstrationRoleAssignmentSchema.js";
import { selectDemonstrationRoleAssignmentOrThrow } from "./queries/selectDemonstrationRoleAssignmentOrThrow.js";
import { selectPersonOrThrow } from "../person/queries/selectPersonOrThrow";
import { selectDemonstrationOrThrow } from "../demonstration/queries";
import { Role } from "../../types.js";
import { GraphQLContext } from "../../auth";
import { validateSetDemonstrationRoleInput } from "./validateSetDemonstrationRoleInput";

const DEMONSTRATION_GRANT_LEVEL = "Demonstration";

export async function unsetDemonstrationRoles(
  parent: unknown,
  { input }: { input: UnsetDemonstrationRoleInput[] }
): Promise<PrismaDemonstrationRoleAssignment[]> {
  return prisma().$transaction(async (tx) => {
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
  parent: unknown,
  { input }: { input: SetDemonstrationRoleInput }
): Promise<PrismaDemonstrationRoleAssignment> {
  return prisma().$transaction(async (tx) => {
    await validateSetDemonstrationRoleInput(input, tx);
    const person = await selectPersonOrThrow({ id: input.personId }, tx);
    const demonstration = await selectDemonstrationOrThrow({ id: input.demonstrationId }, tx);

    await tx.demonstrationRoleAssignment.upsert({
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
      await tx.primaryDemonstrationRoleAssignment.upsert({
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
          personTypeId: person.personTypeId,
        },
      });
    } else if (input.isPrimary === false) {
      await tx.primaryDemonstrationRoleAssignment.deleteMany({
        where: {
          demonstrationId: demonstration.id,
          roleId: input.roleId,
          personId: person.id,
        },
      });
    }
    return selectDemonstrationRoleAssignmentOrThrow({
      personId: input.personId,
      demonstrationId: input.demonstrationId,
      roleId: input.roleId,
    });
  });
}

export async function setDemonstrationRoles(
  parent: unknown,
  { input }: { input: SetDemonstrationRoleInput[] }
): Promise<PrismaDemonstrationRoleAssignment[]> {
  return prisma().$transaction(async (tx) => {
    const results = [];

    for (const roleInput of input) {
      await validateSetDemonstrationRoleInput(roleInput, tx);

      const person = await selectPersonOrThrow({ id: roleInput.personId }, tx);
      const demonstration = await selectDemonstrationOrThrow({ id: roleInput.demonstrationId }, tx);

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
            personTypeId: person.personTypeId,
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
      const result = await selectDemonstrationRoleAssignmentOrThrow(
        {
          personId: roleInput.personId,
          demonstrationId: roleInput.demonstrationId,
          roleId: roleInput.roleId,
        },
        tx
      );

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
    person: async (
      parent: PrismaDemonstrationRoleAssignment,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Person> => {
      const person = await context.loaders.personById.load(parent.personId);
      if (!person) {
        throw new Error("No person found matching the provided filter");
      }
      return person;
    },
    role: (parent: PrismaDemonstrationRoleAssignment): Role => parent.roleId as Role,
    demonstration: async (
      parent: PrismaDemonstrationRoleAssignment,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Demonstration> => {
      const demonstration = await context.loaders.demonstrationById.load(parent.demonstrationId);
      if (!demonstration) {
        throw new Error("No demonstration found matching the provided filter");
      }
      return demonstration;
    },
    isPrimary: async (parent: PrismaDemonstrationRoleAssignment): Promise<boolean> => {
      return !!(await prisma().primaryDemonstrationRoleAssignment.findUnique({
        where: {
          personId_demonstrationId_roleId_personTypeId: {
            personId: parent.personId,
            demonstrationId: parent.demonstrationId,
            roleId: parent.roleId,
            personTypeId: parent.personTypeId,
          },
        },
      }));
    },
  },
};
