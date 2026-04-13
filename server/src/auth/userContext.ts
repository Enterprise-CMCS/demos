import { prisma } from "../prismaClient";
import { UserType } from "../types";
import { AuthorizationClaims } from "./auth.util";

export type ContextUser = {
  id: string;
  cognitoSubject: string;
  personTypeId: UserType;
};

async function createNewUserFromClaims(claims: AuthorizationClaims) {
  const person = await prisma().person.create({
    data: {
      personTypeId: claims.role,
      email: claims.email,
      firstName: claims.givenName,
      lastName: claims.familyName,
    },
  });

  return await prisma().user.create({
    data: {
      id: person.id,
      personTypeId: person.personTypeId,
      cognitoSubject: claims.sub,
      username: claims.externalUserId,
    },
  });
}

export async function findOrCreateContextUserFromClaims(
  claims: AuthorizationClaims
): Promise<ContextUser> {
  const existingUser = await prisma().user.findUnique({
    where: { cognitoSubject: claims.sub },
  });

  if (existingUser) {
    return {
      id: existingUser.id,
      cognitoSubject: existingUser.cognitoSubject,
      personTypeId: existingUser.personTypeId as UserType,
    };
  }

  const newUser = await createNewUserFromClaims(claims);
  return {
    id: newUser.id,
    cognitoSubject: newUser.cognitoSubject,
    personTypeId: newUser.personTypeId as UserType,
  };
}
