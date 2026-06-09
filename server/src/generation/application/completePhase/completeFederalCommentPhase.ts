import { prisma } from "../../../prismaClient";
import { DateType, PhaseName, PhaseStatus } from "../../../types";

/*
 * Because of the uniqueness of this phase, we will update it via a direct database update.
 * This does not contain 100% of the behavior, but will set the phase to complete if the
 * current date is past the federal comment period end date.
 */
export const completeFederalCommentPhase = async ({ applicationId }: { applicationId: string }) => {
  const application = await prisma().applicationDate.findMany({
    where: {
      applicationId: applicationId,
      dateTypeId: {
        in: [
          "Federal Comment Period Start Date",
          "Federal Comment Period End Date",
        ] satisfies DateType[],
      },
    },
  });

  const federalCommentPeriodStartDate = application.find(
    (date) => date.dateTypeId === "Federal Comment Period Start Date"
  );

  const federalCommentPeriodEndDate = application.find(
    (date) => date.dateTypeId === "Federal Comment Period End Date"
  );

  if (!federalCommentPeriodStartDate || !federalCommentPeriodEndDate) {
    throw new Error(
      `Connot complete Federal Comment Phase on application ${applicationId} without both Federal Comment Period Start Date and Federal Comment Period End Date.`
    );
  }

  if (new Date() <= federalCommentPeriodEndDate.dateValue) {
    throw new Error(
      `Cannot complete Federal Comment Phase on application ${applicationId} before Federal Comment Period End Date.`
    );
  }

  await prisma().applicationPhase.update({
    where: {
      applicationId_phaseId: {
        applicationId,
        phaseId: "Federal Comment" satisfies PhaseName,
      },
    },
    data: {
      phaseStatusId: "Completed" satisfies PhaseStatus,
    },
  });
};
