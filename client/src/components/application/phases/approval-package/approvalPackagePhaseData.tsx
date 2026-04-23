import React from "react";
import { WorkflowApplication, ApplicationWorkflowDocument } from "components/application";
import { DocumentType, PhaseName } from "demos-server";
import { ApprovalPackagePhase } from "./ApprovalPackagePhase";

export const REQUIRED_DOCUMENT_TYPES: DocumentType[] = [
  "Final Budget Neutrality Formulation Workbook",
  "Q&A",
  "Special Terms & Conditions",
  "Formal OMB Policy Concurrence Email",
  "Approval Letter",
  "Signed Decision Memo",
] as const;

export const getDocumentsForPhase = (
  application: WorkflowApplication
): (ApplicationWorkflowDocument | undefined)[] => {
  return REQUIRED_DOCUMENT_TYPES.map((type) =>
    application.documents.find(
      (doc) => doc.documentType === type && doc.phaseName === "Approval Package"
    )
  );
};

export const getApprovalPackagePhaseFromApplication = (
  application: WorkflowApplication,
  setSelectedPhase: (phase: PhaseName) => void
) => {
  const approvalPackagePhase = application.phases.find(
    (phase) => phase.phaseName === "Approval Package"
  );

  if (!approvalPackagePhase) {
    console.error("Cannot find approval package phase on application: ", application.id);
    return null;
  }

  const documents = getDocumentsForPhase(application);

  const allPreviousPhasesDone = application.phases
    .filter(
      (p) =>
        p.phaseName !== "Concept" &&
        p.phaseName !== "Approval Package" &&
        p.phaseName !== "Approval Summary"
    )
    .every((phase) => phase.phaseStatus === "Completed" || phase.phaseStatus === "Skipped");

  return (
    <ApprovalPackagePhase
      applicationId={application.id}
      documents={documents}
      allPreviousPhasesDone={allPreviousPhasesDone}
      isReadonly={approvalPackagePhase.phaseStatus === "Completed"}
      onFinish={() => setSelectedPhase("Approval Summary")}
    />
  );
};
