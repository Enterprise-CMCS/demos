import { Prisma, Amendment as PrismaAmendment } from "@prisma/client";
import { prisma } from "../../prismaClient";
import { validateCreateAmendmentInput } from ".";
import { ApplicationStatus, ApplicationType, PhaseName } from "../../types";

const amendmentApplicationType: ApplicationType = "Amendment";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";

export async function createAmendment(
  data: Pick<
    Prisma.AmendmentUncheckedCreateInput,
    "demonstrationId" | "name" | "description" | "signatureLevelId"
  >
): Promise<PrismaAmendment> {
  return await prisma().$transaction(async (tx) => {
    await validateCreateAmendmentInput(data, tx);

    const application = await tx.application.create({
      data: {
        applicationTypeId: amendmentApplicationType,
      },
    });

    return await tx.amendment.create({
      data: {
        ...data,
        id: application.id,
        applicationTypeId: amendmentApplicationType,
        demonstrationStatusId: "Approved" satisfies ApplicationStatus,
        statusId: newApplicationStatusId,
        currentPhaseId: conceptPhaseName,
      },
    });
  });
}
