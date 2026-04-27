import {
  DeliverableDemonstrationType as PrismaDeliverableDemonstrationType,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
  Tag as PrismaTag,
} from "@prisma/client";

export { deleteAllDeliverableDemonstrationTypes } from "./deleteAllDeliverableDemonstrationTypes";
export { insertDeliverableDemonstrationTypes } from "./insertDeliverableDemonstrationTypes";
export { selectDeliverableDemonstrationType } from "./selectDeliverableDemonstrationType";
export { selectManyDeliverableDemonstrationTypes } from "./selectManyDeliverableDemonstrationTypes";

type DemonstrationTypeTagAssignmentQueryResult = PrismaDemonstrationTypeTagAssignment & {
  tag: PrismaTag;
};
export type DeliverableDemonstrationTypeQueryResult = PrismaDeliverableDemonstrationType & {
  demonstrationTypeTagAssignment: DemonstrationTypeTagAssignmentQueryResult;
};
