import { prisma } from "../../prismaClient";
import { createNewTagNameIfNotExists } from "../tagName";
import { insertTag } from "./queries/insertTag";
import { validateCreateTagInput } from "./validateCreateTagInput";

export const createTag = (tagName: string) => {
  return prisma().$transaction(async (tx) => {
    validateCreateTagInput(tagName, tx);

    createNewTagNameIfNotExists(tagName, tx);
    insertTag(tagName, "Demonstration Type", tx);
    insertTag(tagName, "Application", tx);
  });
};
