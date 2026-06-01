import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { ApplicationType, PhaseName } from "../../types";
import { uploadDocumentsToPhase } from "../uploadDocumentsToPhase";

const PHASE_NAME: PhaseName = "Approval Package";

export const completeApprovalPackagePhase = async ({
  applicationId,
  documentOwnerUserId,
  applicationType,
}: {
  applicationId: string;
  documentOwnerUserId: string;
  applicationType: ApplicationType;
}) => {
  await uploadDocumentsToPhase({
    applicationId,
    phaseName: PHASE_NAME,
    documentOwnerUserId,
    documentTypes: [
      "Approval Letter",
      "Final Budget Neutrality Formulation Workbook",
      "Formal OMB Policy Concurrence Email",
      "Special Terms & Conditions",
      "Q&A",
      "Signed Decision Memo",
    ],
  });

  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: {
      applicationId,
      phaseName: PHASE_NAME,
    },
  });
};
