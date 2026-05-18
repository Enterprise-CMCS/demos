import { PrivateComment as PrismaPrivateComment } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { UserType, NonEmptyString } from "../../../types";

export type AllowedPrivateCommenters = Extract<UserType, "demos-admin" | "demos-cms-user">;

export type InsertPrivateCommentInput = {
  deliverableId: string;
  authorUserId: string;
  authorPersonTypeId: AllowedPrivateCommenters;
  content: NonEmptyString;
};

export async function insertPrivateComment(
  input: InsertPrivateCommentInput,
  tx?: PrismaTransactionClient
): Promise<PrismaPrivateComment> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.privateComment.create({
    data: {
      deliverableId: input.deliverableId,
      authorUserId: input.authorUserId,
      authorPersonTypeId: input.authorPersonTypeId,
      content: input.content,
    },
  });
}
