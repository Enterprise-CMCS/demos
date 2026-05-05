import {
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
  Tag as PrismaTag,
} from "@prisma/client";

export { selectDemonstrationTypeTagAssignment } from "./selectDemonstrationTypeTagAssignment";
export { selectManyDemonstrationTypeTagAssignments } from "./selectManyDemonstrationTypeTagAssignments";
export type DemonstrationTypeTagAssignmentQueryResult = PrismaDemonstrationTypeTagAssignment & {
  tag: PrismaTag;
};
