import { PrivateComment as PrismaPrivateComment } from "@prisma/client";
import { NonEmptyString } from "../../types";
import { GraphQLContext } from "../../auth";
import { prisma } from "../../prismaClient";
import { validateUserPermittedToMakePrivateComment } from ".";
import { insertPrivateComment } from "./queries";

export async function createPrivateComment(
  deliverableId: string,
  comment: NonEmptyString,
  context: GraphQLContext
): Promise<PrismaPrivateComment> {
  return await prisma().$transaction(async (tx) => {
    validateUserPermittedToMakePrivateComment(context);
    return await insertPrivateComment(
      {
        deliverableId: deliverableId,
        authorUserId: context.user.id,
        authorPersonTypeId: context.user.personTypeId,
        content: comment,
      },
      tx
    );
  });
}
