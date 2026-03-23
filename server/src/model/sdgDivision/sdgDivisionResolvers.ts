import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { SDG_DIVISIONS } from "../../constants.js";
import { Demonstration, Prisma } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util.js";
import { GraphQLResolveInfo } from "graphql";

export const sdgDivisionResolvers = {
  SdgDivision: generateCustomSetScalar(
    SDG_DIVISIONS,
    "SdgDivision",
    "A string representing a SDG division."
  ),
};

export function getSdgDivision(
  parent: Demonstration,
  args: unknown,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): string | null {
  const parentType = info.parentType.name;
  switch (parentType) {
    case Prisma.ModelName.Demonstration:
      return parent.sdgDivisionId;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }
}
