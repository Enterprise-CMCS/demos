import { PublicComment as PrismaPublicComment } from "@prisma/client";
import { NonEmptyString } from "../../types";
import { GraphQLContext } from "../../auth";
import { prisma } from "../../prismaClient";
import { validateUserPermittedToMakePublicComment } from ".";
import { insertPublicComment } from "./queries";
import { dispatchPublicCommentAddedEmail } from "../email";

export async function createPublicComment(
  deliverableId: string,
  comment: NonEmptyString,
  context: GraphQLContext
): Promise<PrismaPublicComment> {
  const publicComment = await prisma().$transaction(async (tx) => {
    await validateUserPermittedToMakePublicComment(deliverableId, context, tx);
    return await insertPublicComment(
      {
        deliverableId: deliverableId,
        authorUserId: context.user.id,
        content: comment,
      },
      tx
    );
  });

  await dispatchPublicCommentAddedEmail({
    authorPersonTypeId: context.user.personTypeId,
    deliverableId,
    publicCommentId: publicComment.id,
    triggeredByUserId: context.user.id,
  });

  return publicComment;
}
