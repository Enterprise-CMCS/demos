import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";
import { PrismaTransactionClient } from "../../prismaClient";

export const validateCreateTagInput = (tagName: string, tx: PrismaTransactionClient) => {
  const errors: (string | undefined)[] = [];

  errors.push(await checkTagNameDoesntAlreadyExist(tagName, tx));
  cleanErrorsAndThrow(errors, "createTag", "CREATE_TAG_VALIDATION_FAILED");
};
