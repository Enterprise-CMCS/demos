import {
  SystemRoleAssignment as PrismaSystemRoleAssignment,
  Role as PrismaRole,
  RolePermission as PrismaRolePermission,
  Permission as PrismaPermission,
} from "@prisma/client";

export { selectManySystemRoleAssignments } from "./queries/selectManySystemRoleAssignments";

export type SystemRoleAssignmentQueryResult = PrismaSystemRoleAssignment & {
  role: PrismaRole & {
    rolePermissions: PrismaRolePermission[];
  };
};
