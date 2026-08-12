import type { GraphQLContext } from "../../auth";
import {
  Document as PrismaDocument,
  Person as PrismaPerson,
  User as PrismaUser,
} from "@prisma/client";
import { resolveManyDeliverables } from "../deliverable";
import { getManyDocuments } from "../document";
<<<<<<< HEAD
import { selectManyUsers, selectUserOrThrow } from "./queries";
=======
import { selectUserOrThrow } from "./queries";
>>>>>>> main
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
    person: async (
      parent: PrismaUser,
      _args: unknown,
      context: GraphQLContext
    ): Promise<PrismaPerson> => {
      const person = await context.loaders.personById.load(parent.id);
      if (!person) {
        throw new Error("No person found matching the provided filter");
      }
      return person;
    },
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
