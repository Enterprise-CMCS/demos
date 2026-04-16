import { Prisma } from "@prisma/client";
import { Permission } from "../types";
import { ContextUser } from "./userContext";

export type PermissionFilters<WhereClause> = Partial<Record<Permission, WhereClause>>;

export function isStatePointOfContactOnDemonstration(
  userId: string
): Prisma.DemonstrationWhereInput {
  return {
    demonstrationRoleAssignments: {
      some: {
        personId: userId,
        roleId: "State Point of Contact",
      },
    },
  };
}

export function buildAuthorizationFilter<WhereClause>(
  user: ContextUser,
  getPermissionFilters: (userid: string) => PermissionFilters<WhereClause>
): { OR: WhereClause[] } | null {
  const authorizationWhereClauses: WhereClause[] = [];
  const permissionFilters = getPermissionFilters(user.id);

  for (const permission of Object.keys(permissionFilters) as Permission[]) {
    const permissionWhere = permissionFilters[permission];
    if (permissionWhere && user.permissions.includes(permission)) {
      authorizationWhereClauses.push(permissionWhere);
    }
  }

  if (authorizationWhereClauses.length === 0) {
    return null;
  }

  return {
    OR: authorizationWhereClauses,
  };
}
