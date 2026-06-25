import type { PrismaTransactionClient } from "../../prismaClient";
import { selectManyUsers } from "../../model/user/queries";

export type FindMigratedUserResult = {
  userIds: string[];
  resultType: "Exactly One Match" | "No Match" | "More Than One Match";
};

export async function findNewlyMigratedUserByEmail(
  email: string,
  tx: PrismaTransactionClient
): Promise<FindMigratedUserResult> {
  const users = await selectManyUsers(
    { person: { email: email }, isMigratedFromPmda: true, hasLoggedIn: false },
    tx
  );
  if (users.length === 0) {
    return {
      userIds: [],
      resultType: "No Match",
    };
  } else if (users.length > 1) {
    return {
      userIds: users.map((u) => u.id),
      resultType: "More Than One Match",
    };
  } else {
    return {
      userIds: [users[0].id],
      resultType: "Exactly One Match",
    };
  }
}
