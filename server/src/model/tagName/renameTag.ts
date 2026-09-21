import { prisma } from "../../prismaClient";
import { TagName } from "./tagNameSchema";
import { validateRenameTagInput } from "./validateRenameTagInput";

export const renameTag = (oldName: string, newName: string): Promise<TagName> => {
  return prisma().$transaction(async (tx) => {
    await validateRenameTagInput(oldName, newName, tx);
    return await updateTagName(oldName, newName, tx);
  });
};
