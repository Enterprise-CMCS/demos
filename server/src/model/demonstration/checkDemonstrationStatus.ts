import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { ApplicationStatus } from "../../types";

export function checkDemonstrationStatus(
  demonstration: PrismaDemonstration,
  subjectName: "deliverable" | "amendment" | "extension"
): string | undefined {
  const approvedStatus: ApplicationStatus = "Approved";
  if (demonstration.statusId !== approvedStatus) {
    return `Demonstration ${demonstration.id} is not in Approved status; cannot create ${subjectName}.`;
  }
}
