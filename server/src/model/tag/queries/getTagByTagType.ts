import { prisma } from "../../../prismaClient";
import { TagType } from "../../../types";
import { Tag as PrismaTag } from "@prisma/client";

export async function getTagByTagType(tagTypeId: TagType): Promise<PrismaTag[]> {
  return await prisma().tag.findMany({
    where: {
      tagTypeId: tagTypeId,
    },
  });
}
