import { Permission } from "../types";
import { ContextUser } from "./auth.util";

export type PermissionFilters<PrismaWhereClause extends object> = Partial<
  Record<Permission, PrismaWhereClause>
>;

export function buildAuthorizationFilter<PrismaWhereClause extends object>(
  user: ContextUser,
  getPermissionFilters: (userid: string) => PermissionFilters<PrismaWhereClause>
): {
  OR: PrismaWhereClause[];
} | null {
  const authorizationWhereClauses: PrismaWhereClause[] = [];
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
