import { prisma } from "../prismaClient";
import { Permission, SystemRole, UserType } from "../types";
import { AuthorizationClaims } from "./auth.util";

const initialUserTypeRoles: Record<UserType, SystemRole> = {
  "demos-admin": "Admin User",
  "demos-cms-user": "CMS User",
  "demos-state-user": "State User",
};

export type ContextUser = {
  id: string;
  cognitoSubject: string;
  personTypeId: UserType;
  permissions: Permission[];
};

async function createNewUserFromClaims(claims: AuthorizationClaims): Promise<ContextUser> {
  const person = await prisma().person.create({
    data: {
      personTypeId: claims.role,
      email: claims.email,
      firstName: claims.givenName,
      lastName: claims.familyName,
    },
  });

  const user = await prisma().user.create({
    data: {
      id: person.id,
      personTypeId: person.personTypeId,
      cognitoSubject: claims.sub,
      username: claims.externalUserId,
    },
  });

  const systemRoleAssignment = await prisma().systemRoleAssignment.create({
    data: {
      personId: person.id,
      grantLevelId: "System",
      personTypeId: person.personTypeId,
      // casting enforced by database constraints
      roleId: initialUserTypeRoles[person.personTypeId as UserType],
    },
    include: {
      role: {
        include: {
          rolePermissions: true,
        },
      },
    },
  });

  return {
    id: person.id,
    // casting enforced by database constraints
    personTypeId: person.personTypeId as UserType,
    cognitoSubject: user.cognitoSubject,
    permissions: systemRoleAssignment.role.rolePermissions.map(
      // casting enforced by database constraints
      (rp) => rp.permissionId as Permission
    ),
  };
}

export async function findOrCreateContextUserFromClaims(
  claims: AuthorizationClaims
): Promise<ContextUser> {
  const existingUser = await prisma().user.findUnique({
    where: { cognitoSubject: claims.sub },
    include: {
      person: {
        include: {
          systemRoleAssignments: {
            include: {
              role: {
                include: {
                  rolePermissions: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (existingUser) {
    return {
      id: existingUser.id,
      cognitoSubject: existingUser.cognitoSubject,
      // casting enforced by database constraints
      personTypeId: existingUser.personTypeId as UserType,
      permissions: existingUser.person.systemRoleAssignments.flatMap((assignment) =>
        // casting enforced by database constraints
        assignment.role.rolePermissions.map((rp) => rp.permissionId as Permission)
      ),
    };
  }

  return await createNewUserFromClaims(claims);
}
