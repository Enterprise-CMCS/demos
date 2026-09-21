import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";
import { PrismaTransactionClient } from "../../prismaClient";
import {} from ".";
import { checkTagOldNameExists } from "./checkTagOldNameExists";
import { checkTagNewNameDoesNotExist } from "./checkTagNewNameDoesNotExist";

export const validateRenameTagInput = async (
  oldName: string,
  newName: string,
  tx: PrismaTransactionClient
) => {
  const errors: (string | undefined)[] = [];

  errors.push(
    await checkTagOldNameExists(oldName, tx),
    await checkTagNewNameDoesNotExist(newName, tx)
  );
  cleanErrorsAndThrow(errors, "renameTag", "RENAME_TAG_VALIDATION_FAILED");
};
