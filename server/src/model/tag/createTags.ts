import { prisma } from "../../prismaClient";
import { createNewTagNameIfNotExists } from "../tagName";
import { insertTag, validateCreateTagsInput } from ".";
import { Tag as PrismaTag } from "@prisma/client";

export const createTags = (tagNames: string[]): Promise<PrismaTag[]> => {
  return prisma().$transaction(async (tx) => {
    await validateCreateTagsInput(tagNames, tx);

    const createdTags: PrismaTag[] = [];
    for (const tagName of tagNames) {
      await createNewTagNameIfNotExists(tagName, tx);
      await insertTag(tagName, "Application", tx);
      createdTags.push(await insertTag(tagName, "Demonstration Type", tx));
    }
    return createdTags;
  });
};
