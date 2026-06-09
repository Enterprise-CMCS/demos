import { applicationPhaseResolvers } from "../../../model/applicationPhase/applicationPhaseResolvers";
import { PhaseName } from "../../../types";
import { uploadDocumentsToPhase } from "../../document/uploadDocumentsToPhase";
import { DocumentsInput } from "../../types";

const PHASE_NAME: PhaseName = "Approval Package";

export const completeApprovalPackagePhase = async ({
  applicationId,
  documents,
  documentOwnerUserId,
}: {
  applicationId: string;
  documents: DocumentsInput<
    | "Approval Letter"
    | "Final Budget Neutrality Formulation Workbook"
    | "Formal OMB Policy Concurrence Email"
    | "Special Terms & Conditions"
    | "Q&A"
    | "Signed Decision Memo"
  >;
  documentOwnerUserId: string;
}) => {
  await uploadDocumentsToPhase({
    documents,
    applicationId,
    phaseName: PHASE_NAME,
    ownerUserId: documentOwnerUserId,
  });
  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: { applicationId, phaseName: PHASE_NAME },
  });
};
