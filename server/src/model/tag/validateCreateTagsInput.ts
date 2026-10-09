import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";
import { PrismaTransactionClient } from "../../prismaClient";
import { checkTagsDontAlreadyExist } from ".";

export const validateCreateTagsInput = async (tagNames: string[], tx: PrismaTransactionClient) => {
  const errors: (string | undefined)[] = [];
  errors.push(await checkTagsDontAlreadyExist(tagNames, tx));
  cleanErrorsAndThrow(errors, "createTags", "CREATE_TAGS_VALIDATION_FAILED");
};
