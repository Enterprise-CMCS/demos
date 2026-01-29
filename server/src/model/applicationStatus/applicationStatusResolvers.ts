import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { APPLICATION_STATUS } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { getApplication, PrismaApplication } from "../application";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { updateApplicationStatus } from "../applicationPhase/updateApplicationStatus.js";
import { SetApplicationStatusInput } from "./applicationStatusSchema.js";

async function setApplicationStatus(
  _: unknown,
  { input }: { input: SetApplicationStatusInput }
): Promise<PrismaApplication> {
  try {
    await prisma().$transaction(async (tx) => {
      await updateApplicationStatus(input.applicationId, input.status, tx);
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.applicationId);
}

export const applicationStatusResolvers = {
  ApplicationStatus: generateCustomSetScalar(
    APPLICATION_STATUS,
    "ApplicationStatus",
    "A string representing the status of a demonstration, amendment, or extension."
  ),
  Mutation: {
    setApplicationStatus: setApplicationStatus,
  },
};
