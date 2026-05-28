import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { PhaseName } from "../../types";
import { uploadDocumentToPhase } from "../uploadDocumentToPhase";

const PHASE_NAME: PhaseName = "Approval Package";

export const completeApprovalPackagePhase = async (
  applicationId: string,
  contextUserId: string
) => {
  await uploadDocumentToPhase(applicationId, PHASE_NAME, "Approval Letter", contextUserId);

  await uploadDocumentToPhase(
    applicationId,
    PHASE_NAME,
    "Final Budget Neutrality Formulation Workbook",
    contextUserId
  );

  await uploadDocumentToPhase(
    applicationId,
    PHASE_NAME,
    "Formal OMB Policy Concurrence Email",
    contextUserId
  );

  await uploadDocumentToPhase(
    applicationId,
    PHASE_NAME,
    "Special Terms & Conditions",
    contextUserId
  );

  await uploadDocumentToPhase(applicationId, PHASE_NAME, "Q&A", contextUserId);

  await uploadDocumentToPhase(applicationId, PHASE_NAME, "Signed Decision Memo", contextUserId);

  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: {
      applicationId,
      phaseName: PHASE_NAME,
    },
  });
};
