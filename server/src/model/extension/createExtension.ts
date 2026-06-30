import { Prisma, Extension as PrismaExtension } from "@prisma/client";
import { prisma } from "../../prismaClient";
import { validateCreateExtensionInput } from ".";
import { ApplicationStatus, ApplicationType, PhaseName } from "../../types";

const extensionApplicationType: ApplicationType = "Extension";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";

export async function createExtension(
  data: Pick<
    Prisma.ExtensionUncheckedCreateInput,
    "demonstrationId" | "name" | "description" | "signatureLevelId"
  >
): Promise<PrismaExtension> {
  return await prisma().$transaction(async (tx) => {
    await validateCreateExtensionInput(data, tx);

    const application = await tx.application.create({
      data: {
        applicationTypeId: extensionApplicationType,
      },
    });

    return await tx.extension.create({
      data: {
        ...data,
        id: application.id,
        applicationTypeId: extensionApplicationType,
        demonstrationStatusId: "Approved" satisfies ApplicationStatus,
        statusId: newApplicationStatusId,
        currentPhaseId: conceptPhaseName,
      },
    });
  });
}
