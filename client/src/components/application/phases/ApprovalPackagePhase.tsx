import React from "react";
import { WorkflowApplication, ApplicationWorkflowDocument } from "components/application";
import {
  ApprovalPackageTable,
  ApprovalPackageTableRow,
} from "components/table/tables/ApprovalPackageTable";
import { DocumentType, PhaseName, PhaseStatus } from "demos-server";
import { formatDate } from "util/formatDate";
import { Button } from "components/button";
import { useCompletePhase } from "components/application/phase-status/phaseCompletionQueries";
import { useToast } from "components/toast";
import { FAILED_TO_SAVE_MESSAGE, getPhaseCompletedMessage } from "util/messages";

export interface ApprovalPackagePhaseProps {
  demonstrationId: string;
  documents: (ApplicationWorkflowDocument | undefined)[];
  allPreviousPhasesDone: boolean;
  setSelectedPhase: (phase: PhaseName) => void;
  phaseStatus: PhaseStatus;
}

const REQUIRED_TYPES: DocumentType[] = [
  "Final Budget Neutrality Formulation Workbook",
  "Q&A",
  "Special Terms & Conditions",
  "Formal OMB Policy Concurrence Email",
  "Approval Letter",
  "Signed Decision Memo",
] as const;

export const getApprovalPackagePhaseFromApplication = (
  application: WorkflowApplication,
  setSelectedPhase: (phase: PhaseName) => void
) => {
  const formulationWorkbookDocument = application?.documents.find(
    (doc) =>
      doc.documentType === "Final Budget Neutrality Formulation Workbook" &&
      doc.phaseName === "Approval Package"
  );
  const qaDocument = application?.documents.find(
    (doc) => doc.documentType === "Q&A" && doc.phaseName === "Approval Package"
  );
  const termsAndConditionsDocument = application?.documents.find(
    (doc) =>
      doc.documentType === "Special Terms & Conditions" && doc.phaseName === "Approval Package"
  );
  const ombPolicyDocument = application?.documents.find(
    (doc) =>
      doc.documentType === "Formal OMB Policy Concurrence Email" &&
      doc.phaseName === "Approval Package"
  );
  const approvalLetterDocument = application?.documents.find(
    (doc) => doc.documentType === "Approval Letter" && doc.phaseName === "Approval Package"
  );
  const decisionMemoDocument = application?.documents.find(
    (doc) => doc.documentType === "Signed Decision Memo" && doc.phaseName === "Approval Package"
  );

  const allPreviousPhasesDone = application.phases
    .filter(
      (p) =>
        p.phaseName !== "Concept" &&
        p.phaseName !== "Approval Package" &&
        p.phaseName !== "Approval Summary"
    )
    .every((phase) => phase.phaseStatus === "Completed" || phase.phaseStatus === "Skipped");

  const approvalPackagePhase = application.phases.find(
    (phase) => phase.phaseName === "Approval Package"
  );

  if (!approvalPackagePhase) {
    console.error("Cannot find approval package phase on application: ", application.id);
    return null;
  }

  return (
    <ApprovalPackagePhase
      demonstrationId={application.id}
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
      phaseStatus={approvalPackagePhase.phaseStatus ?? "Not Started"}
    />
  );
};

export const ApprovalPackagePhase = ({
  demonstrationId,
  documents,
  allPreviousPhasesDone,
  setSelectedPhase,
  phaseStatus,
}: ApprovalPackagePhaseProps) => {
  const { showSuccess, showError } = useToast();
  const { completePhase } = useCompletePhase();

  const isPhaseFinalized = phaseStatus === "Completed";

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

  const finishEnabled =
    !isPhaseFinalized && allPreviousPhasesDone && tableRows.every((row) => row.document); // all req documents have been provided

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
