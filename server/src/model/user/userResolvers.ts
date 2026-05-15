import { prisma } from "../../prismaClient";
import type { GraphQLContext } from "../../auth";
import { Event as PrismaEvent, User as PrismaUser } from "@prisma/client";
import { resolveManyDeliverables } from "../deliverable";
import { getManyDocuments } from "../document";
import { getUser } from "./userData";
import { getPerson } from "../person";
import { Permission, Role } from "../../types";
import { selectManySystemRoleAssignments } from "../systemRoleAssignment";

export async function resolveEvents(parent: PrismaUser): Promise<PrismaEvent[]> {
  return await prisma().event.findMany({
    where: {
      userId: parent.id,
    },
  });
}

export const userResolvers = {
  Query: {
    currentUser: (parent: unknown, args: unknown, context: GraphQLContext) =>
      getUser({ id: context.user.id }, context.user),
  },
  User: {
    person: (parent: PrismaUser, args: unknown, context: GraphQLContext) =>
      getPerson({ id: parent.id }, context.user),
    events: resolveEvents,
    ownedDocuments: (parent: PrismaUser, args: unknown, context: GraphQLContext) =>
      getManyDocuments({ ownerUserId: parent.id }, context.user),
    ownedDeliverables: resolveManyDeliverables,
    systemRoles: async (parent: PrismaUser): Promise<Role[]> => {
      const roleAssignments = await selectManySystemRoleAssignments({ personId: parent.id });
      return roleAssignments.map((role) => role.roleId as Role);
    },
    permissions: async (parent: PrismaUser): Promise<Permission[]> => {
      const roleAssignments = await selectManySystemRoleAssignments({ personId: parent.id });
      const permissions = new Set<Permission>();
      roleAssignments.forEach((assignment) => {
        assignment.role.rolePermissions.forEach((rolePermission) => {
          permissions.add(rolePermission.permissionId as Permission);
        });
      });
      return Array.from(permissions);
    },
  },
};
