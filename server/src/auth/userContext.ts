import { prisma } from "../prismaClient";
import { Permission, SystemRole, UserType } from "../types";
import { AuthorizationClaims } from "./auth.util";
import { upsertUserSession } from "../model/userSession/queries";
import { USER_TYPES } from "../constants";

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

export const getPersonTypeFromClaims = (claims: AuthorizationClaims): UserType => {
  const claimsRoles = claims.role.split(",").map((role) => role.trim());
  const applicableRoles = USER_TYPES.filter((userType) => claimsRoles.includes(userType));
  if (applicableRoles.length === 0) {
    throw new Error(`User with cognito subject ${claims.sub} does not have any applicable roles`);
  } else if (applicableRoles.length > 1) {
    throw new Error(
      `Claims with cognito subject ${claims.sub} has multiple applicable roles: ${applicableRoles.join(", ")}`
    );
  }

  return applicableRoles[0];
};

async function createNewUserFromClaims(claims: AuthorizationClaims): Promise<ContextUser> {
  const personTypeId = getPersonTypeFromClaims(claims);

  return await prisma().$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        personTypeId,
        email: claims.email,
        firstName: claims.givenName,
        lastName: claims.familyName,
      },
    });
    // Cast enforced by database constraints
    const newPersonType = person.personTypeId as UserType;

    const user = await tx.user.create({
      data: {
        id: person.id,
        personTypeId: newPersonType,
        cognitoSubject: claims.sub,
        username: claims.externalUserId,
      },
    });

    const systemRoleAssignment = await tx.systemRoleAssignment.create({
      data: {
        personId: person.id,
        grantLevelId: "System",
        personTypeId: newPersonType,
        roleId: initialUserTypeRoles[newPersonType],
      },
      include: {
        role: {
          include: {
            rolePermissions: true,
          },
        },
      },
    });

    await upsertUserSession(person.id, claims.authTime, tx);

    return {
      id: person.id,
      // casting enforced by database constraints
      personTypeId: newPersonType,
      cognitoSubject: user.cognitoSubject,
      permissions: systemRoleAssignment.role.rolePermissions.map(
        // casting enforced by database constraints
        (rp) => rp.permissionId as Permission
      ),
    };
  });
}

export async function findOrCreateContextUserFromClaims(
  claims: AuthorizationClaims
): Promise<ContextUser> {
  const existingContextUser = await prisma().$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { cognitoSubject: claims.sub },
      include: {
        person: {
          include: {
            systemRoleAssignments: true,
          },
        },
      },
    });

    if (existingUser) {
      const userRoles = existingUser.person.systemRoleAssignments.map(
        (assignment) => assignment.roleId
      );

      const userRolePermissions = await tx.rolePermission.findMany({
        where: {
          roleId: {
            in: userRoles,
          },
        },
      });

      await upsertUserSession(existingUser.id, claims.authTime, tx);

      return {
        id: existingUser.id,
        cognitoSubject: existingUser.cognitoSubject,
        // casting enforced by database constraints
        personTypeId: existingUser.personTypeId as UserType,
        permissions: userRolePermissions.map(
          (rolePermission) => rolePermission.permissionId as Permission
        ),
      };
    } else {
      return null;
    }
  });

  if (existingContextUser) {
    return existingContextUser;
  } else {
    return await createNewUserFromClaims(claims);
  }
}
