import type { AuthorizationClaims } from "..";
import type { ContextUser } from ".";
import { prisma } from "../../prismaClient";
import { upsertUserSession } from "../../model/userSession/queries";
import { createNewUserFromClaims, findUserByCognitoSubject } from ".";

export async function findOrCreateContextUserFromClaims(
  claims: AuthorizationClaims
): Promise<ContextUser> {
  return await prisma().$transaction(async (tx) => {
    const returnedUser =
      (await findUserByCognitoSubject(claims.sub, tx)) ??
      (await createNewUserFromClaims(claims, tx));
    await upsertUserSession(returnedUser.id, claims.authTime, tx);
    return returnedUser;
  });
}
