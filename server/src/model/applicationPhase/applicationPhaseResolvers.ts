import {
  Amendment,
  Demonstration,
  Extension,
  Prisma,
  ApplicationPhase as PrismaApplicationPhase,
} from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { completePhase, declareCompletenessPhaseIncomplete, skipConceptPhase } from ".";
import { getDocuments } from "../document/documentResolvers.js";
import { GraphQLContext } from "../../auth/auth.util.js";
import { GraphQLResolveInfo } from "graphql";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getApplicationDates } from "../applicationDate/applicationDateResolvers.js";
import { getApplicationNotes } from "../applicationNote/applicationNoteResolvers.js";

export async function getApplicationPhases(
  parent: Amendment | Demonstration | Extension,
  args: never,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<PrismaApplicationPhase[]> {
  const parentType = info.parentType.name;

  let filter: Prisma.ApplicationPhaseWhereInput;
  switch (parentType) {
    case Prisma.ModelName.Amendment:
      filter = { applicationId: (parent as Extract<typeof parent, Amendment>).id };
      break;
    case Prisma.ModelName.Demonstration:
      filter = { applicationId: (parent as Extract<typeof parent, Demonstration>).id };
      break;
    case Prisma.ModelName.Extension:
      filter = { applicationId: (parent as Extract<typeof parent, Extension>).id };
      break;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }
  try {
    return await prisma().applicationPhase.findMany({
      where: {
        ...filter,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export const applicationPhaseResolvers = {
  ApplicationPhase: {
    phaseName: (parent: PrismaApplicationPhase) => parent.phaseId,
    phaseStatus: (parent: PrismaApplicationPhase) => parent.phaseStatusId,
    phaseDates: getApplicationDates,
    phaseNotes: getApplicationNotes,
    documents: getDocuments,
  },

  Mutation: {
    completePhase: completePhase,
    skipConceptPhase: skipConceptPhase,
    declareCompletenessPhaseIncomplete: declareCompletenessPhaseIncomplete,
  },
};
