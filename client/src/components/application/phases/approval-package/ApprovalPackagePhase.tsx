import React from "react";
import { ApplicationWorkflowDocument } from "components/application";
import {
  ApprovalPackageTable,
  ApprovalPackageTableRow,
} from "components/table/tables/ApprovalPackageTable";
import { Button } from "components/button";
import { useCompletePhase } from "components/application/phase-status/phaseCompletionQueries";
import { useToast } from "components/toast";
import { FAILED_TO_SAVE_MESSAGE, getPhaseCompletedMessage } from "util/messages";
import { formatDate } from "util/formatDate";
import { REQUIRED_DOCUMENT_TYPES } from "./approvalPackagePhaseData";

export interface ApprovalPackagePhaseProps {
  applicationId: string;
  documents: (ApplicationWorkflowDocument | undefined)[];
  allPreviousPhasesDone: boolean;
  isReadonly: boolean;
  onFinish: () => void;
}

export const ApprovalPackagePhase = ({
  applicationId,
  documents,
  allPreviousPhasesDone,
  isReadonly,
  onFinish,
}: ApprovalPackagePhaseProps) => {
  const { showSuccess, showError } = useToast();
  const { completePhase } = useCompletePhase();

  const tableRows: ApprovalPackageTableRow[] = REQUIRED_DOCUMENT_TYPES.map((type) => {
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

  const allDocumentsUploaded = tableRows.every((row) => row.document);
  const finishEnabled = !isReadonly && allPreviousPhasesDone && allDocumentsUploaded;

  const handleFinish = async () => {
    try {
      await completePhase({
        applicationId,
        phaseName: "Approval Package",
      });
      showSuccess(getPhaseCompletedMessage("Approval Package"));
      onFinish();
    } catch {
      showError(FAILED_TO_SAVE_MESSAGE);
    }
  };

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">APPROVAL</h3>
      <p className="text-sm text-text-placeholder mb-4">
        List of all required documents/reviews needed for approval.
      </p>

      <h4 className="text-[18px] font-bold tracking-wide mb-1">APPROVAL PACKAGE</h4>
      <p className="text-sm text-text-placeholder">Each file type is required prior to approval</p>

      <ApprovalPackageTable demonstrationId={applicationId} rows={tableRows} />

      <div className="mt-8 mb-8 flex justify-end gap-2">
        <Button
          name="button-finish-approval-package"
          size="small"
          disabled={!finishEnabled}
          onClick={handleFinish}
        >
          Finish
        </Button>
      </div>
    </div>
  );
};
