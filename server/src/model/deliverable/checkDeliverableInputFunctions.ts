import {
  Demonstration as PrismaDemonstration,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
  User as PrismaUser,
} from "@prisma/client";
import { ApplicationStatus, PersonType, TagName } from "../../types";
import { findDuplicates } from "../../validationUtilities";

export function checkDemonstrationStatus(demonstration: PrismaDemonstration): string | undefined {
  const approvedStatus: ApplicationStatus = "Approved";
  if (demonstration.statusId !== approvedStatus) {
    return `Demonstration ${demonstration.id} is not in Approved status; cannot create deliverable.`;
  }
}

export function checkOwnerPersonType(ownerUser: PrismaUser): string | undefined {
  const permittedOwnerPersonTypes: readonly PersonType[] = ["demos-admin", "demos-cms-user"];
  if (!permittedOwnerPersonTypes.includes(ownerUser.personTypeId as PersonType)) {
    return `User ${ownerUser.id} is not a CMS user; cannot own deliverable.`;
  }
}

export function checkRequestedDeliverableDemonstrationType(
  requestedDeliverableDemonstrationType: TagName,
  demonstrationTypeTagAssignments: PrismaDemonstrationTypeTagAssignment[],
  demonstrationId: string
): string | undefined {
  const existingDemonstrationTypes = demonstrationTypeTagAssignments.map(
    (assignment) => assignment.tagNameId
  ) as TagName[];
  if (!existingDemonstrationTypes.includes(requestedDeliverableDemonstrationType)) {
    return (
      `Demonstration type ${requestedDeliverableDemonstrationType} does not exist on ` +
      `demonstration ${demonstrationId}; cannot be assigned to deliverable.`
    );
  }
}

export function checkForDuplicateDemonstrationTypes(input: TagName[]): string | undefined {
  const duplicates = findDuplicates(input);
  if (duplicates.length > 0) {
    return `Duplicate demonstration types were included on the input: ${duplicates.join(", ")}.`;
  }
}
