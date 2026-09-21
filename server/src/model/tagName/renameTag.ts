import { TagName } from "@prisma/client";
import { prisma } from "../../prismaClient";
import { updateTagName } from "./queries/updateTagName";
import { validateRenameTagInput } from "./validateRenameTagInput";

export const renameTag = (oldName: string, newName: string): Promise<TagName> => {
  return prisma().$transaction(async (tx) => {
    await validateRenameTagInput(oldName, newName, tx);
    return await updateTagName({ id: oldName }, { id: newName }, tx);
  });
};
