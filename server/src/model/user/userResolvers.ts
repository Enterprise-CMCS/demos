import type { GraphQLContext } from "../../auth";
import { User as PrismaUser } from "@prisma/client";
import { resolveManyDeliverables } from "../deliverable";
import { getManyDocuments } from "../document";
import { selectUser } from "./queries";
import { selectPersonOrThrow } from "../person/queries";
import { Permission, Role } from "../../types";
import { selectManySystemRoleAssignments } from "../systemRoleAssignment";
import { selectLastLoginForUser } from "../userSession/queries";

export const userResolvers = {
  Query: {
    currentUser: (parent: unknown, args: unknown, context: GraphQLContext) =>
      selectUser({ id: context.user.id }),
  },
  User: {
    person: (parent: PrismaUser) => selectPersonOrThrow({ id: parent.id }),
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
    lastLogin: async (parent: PrismaUser): Promise<Date | null> => {
      return await selectLastLoginForUser(parent.id);
    },
  },
};
