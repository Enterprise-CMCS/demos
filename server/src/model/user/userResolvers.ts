import type { GraphQLContext } from "../../auth";
import {
  Document as PrismaDocument,
  Person as PrismaPerson,
  User as PrismaUser,
} from "@prisma/client";
import { resolveManyDeliverables } from "../deliverable";
import { getManyDocuments } from "../document";
import { selectManyUsers, selectUserOrThrow } from "./queries";
import { selectPersonOrThrow } from "../person/queries";
import { Permission, Role } from "../../types";
import { selectManySystemRoleAssignments } from "../systemRoleAssignment";
import { selectLastLoginForUser } from "../userSession/queries";

export const userResolvers = {
  Query: {
    users: (): Promise<PrismaUser[]> => selectManyUsers({}),
    currentUser: (parent: unknown, args: unknown, context: GraphQLContext): Promise<PrismaUser> =>
      selectUserOrThrow({ id: context.user.id }),
  },
  User: {
    person: (parent: PrismaUser): Promise<PrismaPerson> => selectPersonOrThrow({ id: parent.id }),
    ownedDocuments: (
      parent: PrismaUser,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> => getManyDocuments({ ownerUserId: parent.id }, context.user),
    ownedDeliverables: resolveManyDeliverables,
    systemRoles: async (parent: PrismaUser): Promise<Role[]> =>
      (await selectManySystemRoleAssignments({ personId: parent.id })).map(
        (role) => role.roleId as Role
      ),
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
    lastLogin: (parent: PrismaUser): Promise<Date | null> => selectLastLoginForUser(parent.id),
  },
};
