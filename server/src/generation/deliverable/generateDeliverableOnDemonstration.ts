import { GraphQLContext } from "../../auth";
import { DeliverableType } from "../../constants";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../dateUtilities";
import { deliverableResolvers } from "../../model/deliverable/deliverableResolvers";
import { LocalDate } from "../../types";

export const generateDeliverableOnDemonstration = async ({
  demonstrationId,
  name,
  cmsOwnerUserId,
  deliverableType,
  dueDate,
}: {
  demonstrationId: string;
  name: string;
  cmsOwnerUserId: string;
  deliverableType: DeliverableType;
  dueDate: Date;
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
        name,
        deliverableType,
        dueDate: formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(dueDate)) as LocalDate,
      },
    },
    context
  );
  return deliverable;
};
