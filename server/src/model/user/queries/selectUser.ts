import { User as PrismaUser, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectUser(
  where: Prisma.UserWhereInput,
  shouldAlwaysReturn: true,
  tx?: PrismaTransactionClient
): Promise<PrismaUser>;

export async function selectUser(
  where: Prisma.UserWhereInput,
  shouldAlwaysReturn: false,
  tx?: PrismaTransactionClient
): Promise<PrismaUser | null>;

export async function selectUser(
  where: Prisma.UserWhereInput,
  shouldAlwaysReturn: boolean,
  tx?: PrismaTransactionClient
): Promise<PrismaUser | null> {
  const prismaClient = tx ?? prisma();
  const result = prismaClient.user.findAtMostOne({ where });
  if (shouldAlwaysReturn && !result) {
    throw new Error(
      `Expected selectUser to return a record but it did not! Where clause: ${JSON.stringify(where)}`
    );
  }
  return result;
}
