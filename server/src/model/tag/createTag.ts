import { prisma } from "../../prismaClient";
import { createNewTagNameIfNotExists } from "../tagName";
import { insertTag, validateCreateTagInput } from ".";
import { Tag as PrismaTag } from "@prisma/client";

export const createTag = (tagName: string): Promise<PrismaTag> => {
  return prisma().$transaction(async (tx) => {
    await validateCreateTagInput(tagName, tx);
    await createNewTagNameIfNotExists(tagName, tx);
    await insertTag(tagName, "Application", tx);
    return await insertTag(tagName, "Demonstration Type", tx);
  });
};
