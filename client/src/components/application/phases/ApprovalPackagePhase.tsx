import React from "react";
import { ApplicationWorkflowDemonstration, ApplicationWorkflowDocument } from "components/application/ApplicationWorkflow";
import { ApprovalPackageTable, ApprovalPackageTableRow } from "components/table/tables/ApprovalPackageTable";
import { DocumentType } from "demos-server";
import { formatDate } from "util/formatDate";
import { Button, SecondaryButton } from "components/button";

export interface ApprovalPackagePhaseProps {
  demonstrationId: string;
  documents: (ApplicationWorkflowDocument | undefined)[];
}

const REQUIRED_TYPES: DocumentType[] = [
  "Final Budget Neutrality Formulation Workbook",
  "Q&A",
  "Special Terms & Conditions",
  "Formal OMB Policy Concurrence Email",
  "Approval Letter",
  "Signed Decision Memo",
] as const;

export const getApprovalPackagePhase = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const formulationWorkbookDocument = demonstration?.documents.find(
    (doc) => doc.documentType === "Final Budget Neutrality Formulation Workbook"
  );
  const qaDocument = demonstration?.documents.find(
    (doc) => doc.documentType === "Q&A"
  );
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
    />
  );
};

export const ApprovalPackagePhase = ({
  demonstrationId,
  documents,
}: ApprovalPackagePhaseProps) => {
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

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">APPROVAL</h3>
      <p className="text-sm text-text-placeholder mb-4">
        List of all required documents/reviews needed for approval.
      </p>

      <h4 className="text-[18px] font-bold tracking-wide mb-1">APPROVAL PACKAGE</h4>
      <p className="text-sm text-text-placeholder">
        Each File Type Is Required Prior To Approval
      </p>

      <ApprovalPackageTable
        demonstrationId={demonstrationId}
        rows={tableRows}
      />

      {/* LOGIC TO BE ADDED VIA DEMOS-1038 */}
      <div className="mt-8 mb-8 flex justify-end gap-2">
        <SecondaryButton
          name="button-skip-concept"
          onClick={() => {}}
          size="small"
          //disabled={!isSkipEnabled}
        >
          Save For Later
        </SecondaryButton>
        <Button
          name="button-finish-concept"
          onClick={() => {}}
          //disabled={!isFinishEnabled}
          size="small"
        >
          Finish
        </Button>
      </div>
    </div>
  );
};
