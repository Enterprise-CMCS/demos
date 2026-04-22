import { DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment } from "@prisma/client";

export { selectDemonstrationRoleAssignment } from "./selectDemonstrationRoleAssignment";
export { selectManyDemonstrationRoleAssignments } from "./selectManyDemonstrationRoleAssignments";
export type DemonstrationRoleAssignmentQueryResult = PrismaDemonstrationRoleAssignment & {
  isPrimary: boolean;
};
