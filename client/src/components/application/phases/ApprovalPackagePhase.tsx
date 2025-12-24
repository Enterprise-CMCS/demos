import React from "react";
import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
  SimplePhase,
} from "components/application/ApplicationWorkflow";
import {
  ApprovalPackageTable,
  ApprovalPackageTableRow,
} from "components/table/tables/ApprovalPackageTable";
import { DocumentType } from "demos-server";
import { formatDate } from "util/formatDate";
import { Button } from "components/button";
import { useSetPhaseStatus } from "components/application/phase-status/phaseStatusQueries";
import { useToast } from "components/toast";
import { FAILED_TO_SAVE_MESSAGE, getPhaseCompletedMessage } from "util/messages";

export interface ApprovalPackagePhaseProps {
  demonstrationId: string;
  documents: (ApplicationWorkflowDocument | undefined)[];
  allPreviousPhasesDone: boolean;
}

const REQUIRED_TYPES: DocumentType[] = [
  "Final Budget Neutrality Formulation Workbook",
  "Q&A",
  "Special Terms & Conditions",
  "Formal OMB Policy Concurrence Email",
  "Approval Letter",
  "Signed Decision Memo",
] as const;

export type ApprovalPackagePhase = Pick<SimplePhase, "phaseName" | "phaseStatus">;
export type ApprovalPackagePhaseDemonstration = Pick<
  ApplicationWorkflowDemonstration,
  "id" | "documents"
> & {
  phases: ApprovalPackagePhase[];
};

export const getApprovalPackagePhase = (demonstration: ApprovalPackagePhaseDemonstration) => {
  const formulationWorkbookDocument = demonstration?.documents.find(
    (doc) => doc.documentType === "Final Budget Neutrality Formulation Workbook"
  );
  const qaDocument = demonstration?.documents.find((doc) => doc.documentType === "Q&A");
  const termsAndConditionsDocument = demonstration?.documents.find(
    (doc) => doc.documentType === "Special Terms & Conditions"
  );
  const ombPolicyDocument = demonstration?.documents.find(
    (doc) => doc.documentType === "Formal OMB Policy Concurrence Email"
  );
  const approvalLetterDocument = demonstration?.documents.find(
    (doc) => doc.documentType === "Approval Letter"
  );
  const decisionMemoDocument = demonstration?.documents.find(
    (doc) => doc.documentType === "Signed Decision Memo"
  );

  const currentPhaseIndex = demonstration.phases.findIndex(
    (p) => p.phaseName === "Approval Package"
  );
  const allPreviousPhasesDone = demonstration.phases
    .slice(0, currentPhaseIndex) // all phases before the current one
    .every((phase) => phase.phaseStatus === "Completed" || phase.phaseStatus === "Skipped");

  return (
    <ApprovalPackagePhase
      demonstrationId={demonstration.id}
      documents={[
        formulationWorkbookDocument,
        qaDocument,
        termsAndConditionsDocument,
        ombPolicyDocument,
        approvalLetterDocument,
        decisionMemoDocument,
      ]}
      allPreviousPhasesDone={allPreviousPhasesDone}
    />
  );
};

export const ApprovalPackagePhase = ({
  demonstrationId,
  documents,
  allPreviousPhasesDone,
}: ApprovalPackagePhaseProps) => {
  const { showSuccess, showError } = useToast();
  const { setPhaseStatus: completeApprovalPackagePhase } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Approval Package",
    phaseStatus: "Completed",
  });

  const tableRows: ApprovalPackageTableRow[] = REQUIRED_TYPES.map((type) => {
    const doc = documents.find((doc) => doc?.documentType === type);

    if (!doc) {
      return {
        documentType: type,
        id: undefined,
        name: "-",
        description: "-",
        uploadedBy: "-",
        uploadedDate: "-",
        document: undefined,
      };
    }

    return {
      documentType: type,
      id: doc.id,
      name: doc.name || "-",
      description: doc.description || "-",
      uploadedBy: doc.owner?.person?.fullName || "-",
      uploadedDate: formatDate(doc.createdAt) || "-",
      document: doc,
    };
  });

  const finishEnabled = allPreviousPhasesDone && tableRows.every((row) => row.document); // all req documents have been provided

  const handleFinishApprovalPackagePhase = async () => {
    try {
      await completeApprovalPackagePhase();
    } catch {
      showError(FAILED_TO_SAVE_MESSAGE);
      return;
    }

    showSuccess(getPhaseCompletedMessage("Approval Package"));
  };

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">APPROVAL</h3>
      <p className="text-sm text-text-placeholder mb-4">
        List of all required documents/reviews needed for approval.
      </p>

      <h4 className="text-[18px] font-bold tracking-wide mb-1">APPROVAL PACKAGE</h4>
      <p className="text-sm text-text-placeholder">Each File Type Is Required Prior To Approval</p>

      <ApprovalPackageTable demonstrationId={demonstrationId} rows={tableRows} />

      <div className="mt-8 mb-8 flex justify-end gap-2">
        <Button
          name="button-finish-concept"
          size="small"
          disabled={!finishEnabled}
          onClick={handleFinishApprovalPackagePhase}
        >
          Finish
        </Button>
      </div>
    </div>
  );
};
