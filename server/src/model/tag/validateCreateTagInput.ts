import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";
import { PrismaTransactionClient } from "../../prismaClient";
import { checkTagDoesntAlreadyExist } from ".";

export const validateCreateTagInput = async (tagName: string, tx: PrismaTransactionClient) => {
  const errors: (string | undefined)[] = [];

  errors.push(await checkTagDoesntAlreadyExist(tagName, tx));
  cleanErrorsAndThrow(errors, "createTag", "CREATE_TAG_VALIDATION_FAILED");
};
