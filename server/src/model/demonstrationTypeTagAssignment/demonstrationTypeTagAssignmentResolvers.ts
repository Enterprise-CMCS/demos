import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { DEMONSTRATION_TYPE_STATUSES } from "../../constants";
import { SetDemonstrationTypesInput } from "../../types";

import {
  checkForDuplicateDemonstrationTypes,
  createAndUpsertDemonstrationTypeAssignments,
  deleteDemonstrationTypeAssignments,
  parseSetDemonstrationTypesInput,
} from ".";
import { generateCustomSetScalar } from "../../customScalarResolvers";
import { getApplication } from "../application/applicationResolvers";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma } from "../../prismaClient";

export async function setDemonstrationTypes(
  parent: unknown,
  { input }: { input: SetDemonstrationTypesInput }
): Promise<PrismaDemonstration> {
  if (input.demonstrationTypes.length === 0) {
    return await getApplication(input.demonstrationId, "Demonstration");
  }
  try {
    checkForDuplicateDemonstrationTypes(input);
    const parsedInput = parseSetDemonstrationTypesInput(input);
    await prisma().$transaction(async (tx) => {
      await createAndUpsertDemonstrationTypeAssignments(parsedInput, tx);
      await deleteDemonstrationTypeAssignments(parsedInput, tx);
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.demonstrationId, "Demonstration");
}

export const demonstrationTypeTagAssignmentResolvers = {
  DemonstrationTypeStatus: generateCustomSetScalar(
    DEMONSTRATION_TYPE_STATUSES,
    "DemonstrationTypeStatus",
    "A string representing the status of a demonstration type."
  ),
  Mutation: {
    setDemonstrationTypes: setDemonstrationTypes,
  },
};
