import { Permission } from "../types";
import { ContextUser } from "./auth.util";

export type PermissionMap<PrismaWhereClause extends object> = Partial<
  Record<Permission, PrismaWhereClause>
>;

export function buildAuthorizationFilter<PrismaWhereClause extends object>(
  user: ContextUser,
  permissionMapper: (userid: string) => PermissionMap<PrismaWhereClause>
): {
  OR: PrismaWhereClause[];
} | null {
  const authorizationWhereClauses: PrismaWhereClause[] = [];
  const permissionMap = permissionMapper(user.id);

  for (const permission of Object.keys(permissionMap) as Permission[]) {
    const permissionWhere = permissionMap[permission];
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
