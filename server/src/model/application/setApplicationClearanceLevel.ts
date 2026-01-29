import { prisma } from "../../prismaClient";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { SetApplicationClearanceLevelInput } from "./applicationSchema";
import { getFinishedApplicationPhaseIds } from "../applicationPhase";
import { getApplication, PrismaApplication } from ".";
import { ApplicationType } from "../../types";

export async function setApplicationClearanceLevel(
  _: unknown,
  { input }: { input: SetApplicationClearanceLevelInput }
): Promise<PrismaApplication> {
  try {
    const application = await getApplication(input.applicationId);
    const applicationType = application.applicationTypeId as ApplicationType;

    return await prisma().$transaction(async (tx) => {
      const finishedApplicationPhaseIds = await getFinishedApplicationPhaseIds(
        tx,
        input.applicationId
      );

      if (finishedApplicationPhaseIds.find((phase) => phase === "Review")) {
        throw new Error("Cannot change clearance level after the Review phase has been completed.");
      }

      switch (applicationType) {
        case "Demonstration":
          return await tx.demonstration.update({
            where: { id: input.applicationId },
            data: { clearanceLevelId: input.clearanceLevel },
          });
        case "Amendment":
          return await tx.amendment.update({
            where: { id: input.applicationId },
            data: { clearanceLevelId: input.clearanceLevel },
          });
        case "Extension":
          return await tx.extension.update({
            where: { id: input.applicationId },
            data: { clearanceLevelId: input.clearanceLevel },
          });
      }
    });
  } catch (error) {
    handlePrismaError(error);
  }
}
