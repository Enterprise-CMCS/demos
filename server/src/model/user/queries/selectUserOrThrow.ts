import { Prisma, User as PrismaUser } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { selectUser } from "./selectUser";

export async function selectUserOrThrow(
  filter: Prisma.UserWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaUser> {
  const user = await selectUser(filter, tx);
  if (!user) {
    throw new Error("No user found matching the provided filter");
  }
  return user;
}
