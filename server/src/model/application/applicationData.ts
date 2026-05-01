import { Prisma } from "@prisma/client";
import { isAStatePointOfContactAssociatedWithAmendment } from "../amendment/amendmentData";
import { isAStatePointOfContactAssociatedWithDemonstration } from "../demonstration/demonstrationData";
import { isAStatePointOfContactAssociatedWithExtension } from "../extension/extensionData";

export const isAStatePointOfContactAssociatedWithApplication = (
  userId: string
): Prisma.ApplicationWhereInput => ({
  OR: [
    {
      demonstration: isAStatePointOfContactAssociatedWithDemonstration(userId),
    },
    {
      amendment: isAStatePointOfContactAssociatedWithAmendment(userId),
    },
    {
      extension: isAStatePointOfContactAssociatedWithExtension(userId),
    },
  ],
});
