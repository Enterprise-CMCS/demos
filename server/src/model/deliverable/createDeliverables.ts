import type { Deliverable } from "@prisma/client";

import type { GraphQLContext } from "../../auth";
import type { CreateDeliverableInput } from "../../types";
import { dispatchMultipleDeliverablesCreatedEmail } from "../email";
import { createDeliverable } from "./createDeliverable";

export async function createDeliverables(
  inputs: CreateDeliverableInput[],
  context: GraphQLContext
): Promise<Deliverable[]> {
  if (inputs.length === 0) {
    throw new Error("Cannot create deliverables without at least one input.");
  }

  if (inputs.length === 1) {
    return [await createDeliverable(inputs[0], context)];
  }

  const firstInput = inputs[0];
  if (
    inputs.some(
      (input) =>
        input.demonstrationId !== firstInput.demonstrationId ||
        input.deliverableType !== firstInput.deliverableType ||
        input.cmsOwnerUserId !== firstInput.cmsOwnerUserId
    )
  ) {
    throw new Error("Multiple deliverables must have the same demonstration, deliverable type, and CMS owner.");
  }

  const deliverables = await Promise.all(
    inputs.map((input) => createDeliverable(input, context, { sendEmailNotifications: false }))
  );

  await dispatchMultipleDeliverablesCreatedEmail({
    deliverableIds: deliverables.map(({ id }) => id),
    triggeredByUserId: context.user.id
  });

  return deliverables;
}
