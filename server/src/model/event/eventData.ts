import { Prisma } from "@prisma/client";
import { isAStatePointOfContactAssociatedWithApplication } from "../application/applicationData";

export const isAStatePointOfContactAssociatedWithEvent = (
  userId: string
): Prisma.EventWhereInput => ({
  application: isAStatePointOfContactAssociatedWithApplication(userId),
});
