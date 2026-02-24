import React from "react";
import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
} from "components/application/ApplicationWorkflow";
import {
  ApprovalPackageTable,
  ApprovalPackageTableRow,
} from "components/table/tables/ApprovalPackageTable";
import { DocumentType, PhaseNameWithTrackedStatus } from "demos-server";
import { formatDate } from "util/formatDate";
import { Button } from "components/button";
import { useCompletePhase } from "components/application/phase-status/phaseCompletionQueries";
import { useToast } from "components/toast";
import { FAILED_TO_SAVE_MESSAGE, getPhaseCompletedMessage } from "util/messages";

export interface ApprovalPackagePhaseProps {
  demonstrationId: string;
  documents: (ApplicationWorkflowDocument | undefined)[];
  allPreviousPhasesDone: boolean;
  setSelectedPhase: (phase: PhaseNameWithTrackedStatus) => void;
}

const REQUIRED_TYPES: DocumentType[] = [
  "Final Budget Neutrality Formulation Workbook",
  "Q&A",
  "Special Terms & Conditions",
  "Formal OMB Policy Concurrence",
  "Approval Letter",
  "Signed Decision Memo",
] as const;

export const getApprovalPackagePhase = (
  demonstration: ApplicationWorkflowDemonstration,
  setSelectedPhase: (phase: PhaseNameWithTrackedStatus) => void
) => {
  const formulationWorkbookDocument = demonstration?.documents.find(
    (doc) =>
      doc.documentType === "Final Budget Neutrality Formulation Workbook" &&
      doc.phaseName === "Approval Package"
  );
  const qaDocument = demonstration?.documents.find(
    (doc) => doc.documentType === "Q&A" && doc.phaseName === "Approval Package"
  );
  const termsAndConditionsDocument = demonstration?.documents.find(
    (doc) =>
      doc.documentType === "Special Terms & Conditions" && doc.phaseName === "Approval Package"
  );
  const ombPolicyDocument = demonstration?.documents.find(
    (doc) =>
      doc.documentType === "Formal OMB Policy Concurrence" && doc.phaseName === "Approval Package"
  );
  const approvalLetterDocument = demonstration?.documents.find(
    (doc) => doc.documentType === "Approval Letter" && doc.phaseName === "Approval Package"
  );
  const decisionMemoDocument = demonstration?.documents.find(
    (doc) => doc.documentType === "Signed Decision Memo" && doc.phaseName === "Approval Package"
  );

  const allPreviousPhasesDone = demonstration.phases
    .filter(
      (p) =>
        p.phaseName !== "Concept" &&
        p.phaseName !== "Approval Package" &&
        p.phaseName !== "Approval Summary"
    )
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
      setSelectedPhase={setSelectedPhase}
    />
  );
};

export const ApprovalPackagePhase = ({
  demonstrationId,
  documents,
  allPreviousPhasesDone,
  setSelectedPhase,
}: ApprovalPackagePhaseProps) => {
  const { showSuccess, showError } = useToast();
  const { completePhase } = useCompletePhase();

  const tableRows: ApprovalPackageTableRow[] = REQUIRED_TYPES.map((type) => {
    const doc = documents.find((doc) => doc?.documentType === type);

    if (!doc) {
      return {
        documentType: type,
        id: `${type}-id`,
        name: "-",
        description: "-",
        uploadedBy: "-",
        uploadedDate: "-",
        document: undefined,
      };
    }

    return {
      documentType: type,
      id: `${type}-id`,
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
      await completePhase({
        applicationId: demonstrationId,
        phaseName: "Approval Package",
      });
      setSelectedPhase("Approval Summary");
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
      <p className="text-sm text-text-placeholder">Each file type is required prior to approval</p>

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
