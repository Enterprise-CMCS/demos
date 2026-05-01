import { Prisma } from "@prisma/client";
import { isAStatePointOfContactAssociatedWithDemonstration } from "../demonstration/demonstrationData";

export const isAStatePointOfContactAssociatedWithDeliverable = (
  userId: string
): Prisma.DeliverableWhereInput => ({
  demonstration: isAStatePointOfContactAssociatedWithDemonstration(userId),
});
