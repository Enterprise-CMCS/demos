import type { AuthorizationClaims } from "..";
import type { ContextUser } from ".";
import { prisma } from "../../prismaClient";
import { upsertUserSession } from "../../model/userSession/queries";
import { createNewUserFromClaims, findUserByClaims } from ".";

export async function findOrCreateContextUserFromClaims(
  claims: AuthorizationClaims
): Promise<ContextUser> {
  return await prisma().$transaction(async (tx) => {
    const returnedUser =
      (await findUserByClaims(claims, tx)) ?? (await createNewUserFromClaims(claims, tx));
    await upsertUserSession(returnedUser.id, claims.authTime, tx);
    return returnedUser;
  });
}
