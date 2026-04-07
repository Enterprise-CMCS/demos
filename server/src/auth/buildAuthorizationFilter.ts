import { Permission } from "../types";
import { ContextUser } from "./auth.util";

export type PermissionMap<PrismaWhereClause, TPermission extends string = Permission> = Partial<
  Record<TPermission, PrismaWhereClause>
>;

export function buildAuthorizationFilter<PrismaWhereClause extends object>(
  user: ContextUser,
  permissionMapper: (userid: string) => PermissionMap<PrismaWhereClause>
): {
  OR: PrismaWhereClause[];
} | null {
  const authorizationWhereClauses: PrismaWhereClause[] = [];

  for (const [permission, permissionWhere] of Object.entries(permissionMapper(user.id))) {
    if (user.permissions.includes(permission)) {
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