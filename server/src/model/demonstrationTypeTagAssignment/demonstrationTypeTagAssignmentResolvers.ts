import { Demonstration, Prisma, Demonstration as PrismaDemonstration } from "@prisma/client";
import { DEMONSTRATION_TYPE_STATUSES } from "../../constants";
import { SetDemonstrationTypesInput } from "../../types";

import {
  checkForDuplicateDemonstrationTypes,
  createAndUpsertDemonstrationTypeAssignments,
  deleteDemonstrationTypeAssignments,
  parseSetDemonstrationTypesInput,
} from ".";
import { generateCustomSetScalar } from "../../customScalarResolvers";
import { getApplication } from "../application";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma } from "../../prismaClient";
import { GraphQLContext } from "../../auth/auth.util";
import { GraphQLResolveInfo } from "graphql";
import { determineDemonstrationTypeStatus } from "../demonstration/determineDemonstrationTypeStatus";

export async function getDemonstrationTypeTagAssignments(
  parent: Demonstration,
  args: never,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<
  {
    demonstrationTypeName: string;
    effectiveDate: Date;
    expirationDate: Date;
    status: string;
    approvalStatus: string;
    createdAt: Date;
    updatedAt: Date;
  }[]
> {
  const parentType = info.parentType.name;
  let filter: Prisma.DemonstrationTypeTagAssignmentWhereInput;

  switch (parentType) {
    case Prisma.ModelName.Demonstration:
      filter = { demonstrationId: (parent as Extract<typeof parent, Demonstration>).id };
      break;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  try {
    return (
      await prisma().demonstrationTypeTagAssignment.findMany({
        where: { ...filter },
        include: {
          tag: true,
        },
      })
    ).map((assignment) => ({
      demonstrationTypeName: assignment.tagNameId,
      effectiveDate: assignment.effectiveDate,
      expirationDate: assignment.expirationDate,
      status: determineDemonstrationTypeStatus(assignment.effectiveDate, assignment.expirationDate),
      approvalStatus: assignment.tag.statusId,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }));
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function setDemonstrationTypes(
  parent: unknown,
  { input }: { input: SetDemonstrationTypesInput }
): Promise<PrismaDemonstration> {
  if (input.demonstrationTypes.length === 0) {
    return await getApplication(input.demonstrationId, { applicationTypeId: "Demonstration" });
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
  return await getApplication(input.demonstrationId, { applicationTypeId: "Demonstration" });
}

// This lives here because there is no database model corresponding to it
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
