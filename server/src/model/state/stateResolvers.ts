import { State as PrismaState } from "@prisma/client";
import { type GraphQLContext } from "../../auth";
import { getManyDemonstrations } from "../demonstration";

export const stateResolvers = {
  State: {
    demonstrations: (parent: PrismaState, args: unknown, context: GraphQLContext) =>
      getManyDemonstrations({ stateId: parent.id }, context.user),
  },
};
