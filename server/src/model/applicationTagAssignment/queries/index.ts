import {
  ApplicationTagAssignment as PrismaApplicationTagAssignment,
  Tag as PrismaTag,
} from "@prisma/client";

export { selectApplicationTagAssignment } from "./selectApplicationTagAssignment";
export { selectManyApplicationTagAssignments } from "./selectManyApplicationTagAssignments";
export type ApplicationTagAssignmentQueryResult = PrismaApplicationTagAssignment & {
  tag: PrismaTag;
};
