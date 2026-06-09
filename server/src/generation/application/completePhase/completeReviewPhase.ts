import { applicationPhaseResolvers } from "../../../model/applicationPhase/applicationPhaseResolvers";
import { PhaseName } from "../../../types";
import { addApplicationDates } from "../addApplicationDates";
import { DatesInput } from "../../types";
import { applicationResolvers } from "../../../model/application/applicationResolvers";

const PHASE_NAME: PhaseName = "Review";

export const completeReviewPhase = async ({
  applicationId,
  dates,
}: {
  applicationId: string;
  dates: DatesInput<
    | "OGD Approval to Share with SMEs"
    | "Draft Approval Package to Prep"
    | "DDME Approval Received"
    | "State Concurrence"
    | "BN PMT Approval to Send to OMB"
    | "Draft Approval Package Shared"
    | "Receive OMB Concurrence"
    | "Receive OGC Legal Clearance"
    | "Submit Approval Package to OSORA"
    | "OSORA R1 Comments Due"
    | "OSORA R2 Comments Due"
    | "CMS (OSORA) Clearance End"
    | "Package Sent for COMMs Clearance"
    | "COMMs Clearance Received"
  >;
}) => {
  await applicationResolvers.Mutation.setApplicationClearanceLevel(null, {
    input: { applicationId, clearanceLevel: "CMS (OSORA)" },
  });

  await addApplicationDates({
    applicationId,
    dates,
  });

  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: {
      applicationId,
      phaseName: PHASE_NAME,
    },
  });
};
