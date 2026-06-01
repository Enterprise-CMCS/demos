import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { ApplicationType, ClearanceLevel, PhaseName } from "../../types";
import { TZDate } from "@date-fns/tz";
import { addApplicationDates } from "../addApplicationDates";
import { completeReviewPhaseClearanceLevel } from "../completeReviewPhaseClearanceLevel";

const PHASE_NAME: PhaseName = "Review";

export const completeReviewPhase = async ({
  applicationId,
  baseNow,
  clearanceLevel,
  applicationType,
}: {
  applicationId: string;
  baseNow: TZDate;
  clearanceLevel: ClearanceLevel;
  applicationType: ApplicationType;
}) => {
  await addApplicationDates({
    applicationId,
    dates: [
      {
        dateType: "OGD Approval to Share with SMEs",
        dateValue: baseNow,
      },
      {
        dateType: "Draft Approval Package to Prep",
        dateValue: baseNow,
      },
      {
        dateType: "DDME Approval Received",
        dateValue: baseNow,
      },
      {
        dateType: "State Concurrence",
        dateValue: baseNow,
      },
      {
        dateType: "BN PMT Approval to Send to OMB",
        dateValue: baseNow,
      },
      {
        dateType: "Draft Approval Package Shared",
        dateValue: baseNow,
      },
      {
        dateType: "Receive OMB Concurrence",
        dateValue: baseNow,
      },
      {
        dateType: "Receive OGC Legal Clearance",
        dateValue: baseNow,
      },
    ],
  });

  await completeReviewPhaseClearanceLevel({
    applicationId,
    clearanceLevel,
    baseNow,
    applicationType,
  });

  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: {
      applicationId,
      phaseName: PHASE_NAME,
    },
  });
};
