import { prisma } from "../../../prismaClient";
import { TagType } from "../../../types";
import { TagConfiguration as PrismaTagConfiguration } from "@prisma/client";

export async function getTagConfigurationByTagType(
  tagTypeId: TagType
): Promise<PrismaTagConfiguration[]> {
  return await prisma().tagConfiguration.findMany({
    where: {
      tagTypeId: tagTypeId,
    },
  });
}
