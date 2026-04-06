import {
  createDemonstrationService,
  DemonstrationService,
} from "../model/demonstration/demonstrationService";
import { Permission } from "../types";
import { ContextUser } from "./auth.util";
export type PermissionMap<PrismaWhereClause, TPermission extends string = Permission> = Partial<
  Record<TPermission, PrismaWhereClause>
>;

export type Services = {
  demonstration: DemonstrationService;
};

export function createServices(user: ContextUser): Services {
  return {
    demonstration: createDemonstrationService(user),
  };
}

export function buildAuthorizedWhere<PrismaWhereClause extends object>(
  user: ContextUser,
  where: PrismaWhereClause,
  alwaysFalseClause: PrismaWhereClause,
  permissionMapper: (userid: string) => PermissionMap<PrismaWhereClause>
): {
  AND: [object, { OR: PrismaWhereClause[] }];
} {
  const baseWhere = Object.keys(where).length === 0 ? {} : where;
  const authorizationWhereClauses: PrismaWhereClause[] = [alwaysFalseClause];

  for (const [permission, permissionWhere] of Object.entries(permissionMapper(user.id))) {
    if (user.permissions.includes(permission)) {
      authorizationWhereClauses.push(permissionWhere);
    }
  }

  return {
    AND: [
      baseWhere,
      {
        OR: authorizationWhereClauses,
      },
    ],
  };
}
