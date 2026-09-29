import { TagName } from "@prisma/client";
import { prisma } from "../../prismaClient";
import { updateTagName, validateRenameTagInput } from ".";

export const renameTag = (oldName: string, newName: string): Promise<TagName> => {
  return prisma().$transaction(async (tx) => {
    const trimmedNewName = newName.trim();
    await validateRenameTagInput(oldName, trimmedNewName, tx);
    return await updateTagName({ id: oldName }, { id: trimmedNewName }, tx);
  });
};
