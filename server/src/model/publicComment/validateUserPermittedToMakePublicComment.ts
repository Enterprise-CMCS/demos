import { GraphQLContext } from "../../auth";
import { PrismaTransactionClient } from "../../prismaClient";
import { isStatePointOfContactOnDeliverableDemonstration } from "../deliverable";

export async function validateUserPermittedToMakePublicComment(
  deliverableId: string,
  context: GraphQLContext,
  tx: PrismaTransactionClient
): Promise<void> {
  if (context.user.personTypeId === "demos-state-user") {
    const userAssignedToDemonstration = await isStatePointOfContactOnDeliverableDemonstration(
      deliverableId,
      context.user.id,
      tx
    );
    if (!userAssignedToDemonstration) {
      throw new Error(
        `The user with ID ${context.user.id} is not permitted to create a comment ` +
          `on deliverable ${deliverableId}; user is a state user who is not a State Point of Contact on ` +
          "the associated demonstration."
      );
    }
  }
}
