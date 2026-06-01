import { TZDate } from "@date-fns/tz";
import { deliverableResolvers } from "../model/deliverable/deliverableResolvers";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../dateUtilities";
import { DeliverableType, LocalDate } from "../types";
import { GraphQLContext } from "../auth";

export const generateDeliverable = async ({
  demonstrationId,
  cmsOwnerUserId,
  deliverableType,
}: {
  demonstrationId: string;
  cmsOwnerUserId: string;
  deliverableType: DeliverableType;
}) => {
  const context = {
    user: {
      id: cmsOwnerUserId,
      personTypeId: "demos-cms-user",
    },
  } as GraphQLContext;

  const deliverable = await deliverableResolvers.Mutation.createDeliverable(
    null,
    {
      input: {
        demonstrationId,
        cmsOwnerUserId,
        name: `Deliverable for demonstration ${demonstrationId} - ${new Date().toISOString()}`,
        deliverableType,
        dueDate: formatEasternTZDateToMMDDYYYY(
          parseJSDateToEasternTZDate(new TZDate())
        ) as LocalDate,
      },
    },
    context
  );
  return deliverable;
};
