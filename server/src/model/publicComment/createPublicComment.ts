import { PublicComment as PrismaPublicComment } from "@prisma/client";
import { NonEmptyString } from "../../types";
import { GraphQLContext } from "../../auth";
import { prisma } from "../../prismaClient";
import { validateUserPermittedToMakePublicComment } from "./validateUserPermittedToMakePublicComment";
import { insertPublicComment } from "./queries";

export async function createPublicComment(
  deliverableId: string,
  comment: NonEmptyString,
  context: GraphQLContext
): Promise<PrismaPublicComment> {
  return await prisma().$transaction(async (tx) => {
    await validateUserPermittedToMakePublicComment(deliverableId, context, tx);
    return await insertPublicComment({
      deliverableId: deliverableId,
      authorUserId: context.user.id,
      content: comment,
    });
  });
}
