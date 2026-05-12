import { PublicComment as PrismaPublicComment, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { NonEmptyString } from "../../../types";

export type InsertPublicCommentInput = {
  deliverableId: string;
  authorUserId: string;
  content: NonEmptyString;
};

export async function insertPublicComment(
  input: InsertPublicCommentInput,
  tx?: PrismaTransactionClient
): Promise<PrismaPublicComment> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.publicComment.create({
    data: input,
  });
}
