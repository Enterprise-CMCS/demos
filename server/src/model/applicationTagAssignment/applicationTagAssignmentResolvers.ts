import { prisma } from "../../prismaClient";
import { SetApplicationTagsInput } from "../../types";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { getApplication, PrismaApplication } from "../application";
import {
  createApplicationTagsDemonstrationTypesIfNotExists,
  deleteAllApplicationTags,
  insertApplicationTags,
} from ".";

export async function setApplicationTags(
  _: unknown,
  { input }: { input: SetApplicationTagsInput }
): Promise<PrismaApplication> {
  try {
    await prisma().$transaction(async (tx) => {
      await createApplicationTagsDemonstrationTypesIfNotExists(input.applicationTags, tx);
      await deleteAllApplicationTags(input.applicationId, tx);
      await insertApplicationTags(input.applicationId, input.applicationTags, tx);
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.applicationId);
}

export const applicationTagAssignmentResolvers = {
  Mutation: {
    setApplicationTags: setApplicationTags,
  },
};
