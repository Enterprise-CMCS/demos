import { findNewlyMigratedUserByEmail, findUserByClaims, type ContextUser } from ".";
import type { PrismaTransactionClient } from "../../prismaClient";
import type { AuthorizationClaims } from "..";
import { log } from "../../log";
import { throwCustomGQLError } from "../../errors/errorCodes";
import { updateUser } from "../../model/user/queries";

export async function linkNewlyMigratedUserFromClaims(
  claims: AuthorizationClaims,
  tx: PrismaTransactionClient
): Promise<ContextUser | null> {
  const findUserResult = await findNewlyMigratedUserByEmail(claims.email, tx);

  // If we found no matches, just fall through to the next step
  // If we found more than one, throw an error
  // Otherwise, link and then find the user by the new subject
  if (findUserResult.resultType === "No Match") {
    return null;
  } else if (findUserResult.resultType === "More Than One Match") {
    const errorMessage =
      `Attempted to link Cognito subject ${claims.sub} to migrated users via email; ` +
      "more than one match was found.";
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, "USER_MIGRATION_MULTIPLE_RECORD_ERROR");
  } else {
    await updateUser(
      { id: findUserResult.userIds[0] },
      { cognitoSubject: claims.sub, username: claims.externalUserId, hasLoggedIn: true },
      tx
    );
    return await findUserByClaims(claims, tx);
  }
}
