import { PublicComment as PrismaPublicComment } from "@prisma/client";
import { NonEmptyString } from "../../types";
import { GraphQLContext } from "../../auth";
import { prisma } from "../../prismaClient";
import { validateUserPermittedToMakePublicComment } from ".";
import { insertPublicComment } from "./queries";
import { dispatchPublicCommentAddedEmail } from "../email";

const COMMENT_NOTIFICATION_DELIVERABLE_STATUSES = [
  "Accepted",
  "Approved",
  "Received and Filed",
] as const;

export async function createPublicComment(
  deliverableId: string,
  comment: NonEmptyString,
  context: GraphQLContext
): Promise<PrismaPublicComment> {
  const { publicComment, deliverableStatus } = await prisma().$transaction(async (tx) => {
    await validateUserPermittedToMakePublicComment(deliverableId, context, tx);
    const deliverable = await tx.deliverable.findUniqueOrThrow({
      where: { id: deliverableId },
      select: { statusId: true },
    });
    const publicComment = await insertPublicComment(
      {
        deliverableId: deliverableId,
        authorUserId: context.user.id,
        content: comment,
      },
      tx
    );
    return { publicComment, deliverableStatus: deliverable.statusId };
  });

  if (
    COMMENT_NOTIFICATION_DELIVERABLE_STATUSES.includes(
      deliverableStatus as (typeof COMMENT_NOTIFICATION_DELIVERABLE_STATUSES)[number]
    )
  ) {
    await dispatchPublicCommentAddedEmail({
      deliverableId,
      publicCommentId: publicComment.id,
      triggeredByUserId: context.user.id,
    });
  }

  return publicComment;
}
