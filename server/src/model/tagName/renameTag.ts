import { TagName } from "@prisma/client";
import { prisma } from "../../prismaClient";
import { updateTagName, validateRenameTagInput } from ".";

export const renameTag = (oldName: string, newName: string): Promise<TagName> => {
  return prisma().$transaction(async (tx) => {
    await validateRenameTagInput(oldName, newName, tx);
    return await updateTagName({ id: oldName }, { id: newName }, tx);
  });
};
