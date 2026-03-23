import { Amendment, Demonstration, Extension, Prisma } from "@prisma/client";
import { getFormattedTagsByTagType, Tag } from ".";
import { GraphQLContext } from "../../auth/auth.util";
import { GraphQLResolveInfo } from "graphql";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma } from "../../prismaClient";

export async function getDemonstrationTypes(): Promise<Tag[]> {
  return await getFormattedTagsByTagType("Demonstration Type");
}

export async function queryApplicationTags(): Promise<Tag[]> {
  return await getFormattedTagsByTagType("Application");
}

export async function getApplicationTags(
  parent: Demonstration | Amendment | Extension,
  args: never,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<
  {
    tagName: string;
    approvalStatus: string;
  }[]
> {
  const parentType = info.parentType.name;
  let filter: Prisma.ApplicationTagAssignmentWhereInput;

  switch (parentType) {
    case Prisma.ModelName.Demonstration:
      filter = { applicationId: (parent as Extract<typeof parent, Demonstration>).id };
      break;
    case Prisma.ModelName.Amendment:
      filter = { applicationId: (parent as Extract<typeof parent, Amendment>).id };
      break;
    case Prisma.ModelName.Extension:
      filter = { applicationId: (parent as Extract<typeof parent, Extension>).id };
      break;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  try {
    return (
      await prisma().applicationTagAssignment.findMany({
        where: { ...filter },
        include: {
          tag: true,
        },
      })
    ).map((tagAssignment) => ({
      tagName: tagAssignment.tagNameId,
      approvalStatus: tagAssignment.tag.statusId,
    }));
  } catch (error) {
    handlePrismaError(error);
  }
}

export const tagResolvers = {
  Query: {
    demonstrationTypeOptions: getDemonstrationTypes,
    applicationTagOptions: getApplicationTags,
  },
};
