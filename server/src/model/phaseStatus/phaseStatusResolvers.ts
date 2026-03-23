import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { PHASE_STATUS } from "../../constants.js";
import { ApplicationPhase, Prisma } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util.js";
import { GraphQLResolveInfo } from "graphql";

export const phaseStatusResolvers = {
  PhaseStatus: generateCustomSetScalar(
    PHASE_STATUS,
    "PhaseStatus",
    "A string representing the status of a phase of an application."
  ),
};

