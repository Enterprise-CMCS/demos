import { GraphQLContext } from "../../auth";
import { deliverableResolvers } from "../../model/deliverable/deliverableResolvers";

export const submitDeliverable = async ({
  deliverableId,
  submitterUserId,
}: {
  deliverableId: string;
  submitterUserId: string;
}) => {
  await deliverableResolvers.Mutation.submitDeliverable(
    null,
    {
      id: deliverableId,
    },
    { user: { id: submitterUserId } } as GraphQLContext
  );
};
