import React, { createContext, useContext, useState } from "react";
import {
  DocumentType,
  Tag as DemonstrationTypeName,
  DemonstrationTypeAssignment,
  UploadDocumentInput,
} from "demos-server";
import { CreateDemonstrationDialog } from "./demonstration/CreateDemonstrationDialog";
import { CreateAmendmentDialog } from "./modification/CreateAmendmentDialog";
import { CreateExtensionDialog } from "./modification/CreateExtensionDialog";
import { EditDemonstrationDialog } from "./demonstration";
import { ExistingContactType, ManageContactsDialog } from "./ManageContactsDialog";
import {
  AddDocumentDialog,
  DocumentDialogFields,
  EditDocumentDialog,
  RemoveDocumentDialog,
} from "./document";
import { ApplicationIntakeUploadDialog } from "./document/phases/ApplicationIntakeUploadDialog";
import { CompletenessDocumentUploadDialog } from "./document/phases/CompletenessDocumentUploadDialog";
import { ConceptPreSubmissionUploadDialog } from "./document/phases/ConceptPreSubmissionUploadDialog";
import { FederalCommentUploadDialog } from "./document/phases/FederalCommentUploadDialog";
import { ApprovalPackageUploadDialog } from "./document/phases/ApprovalPackageUploadDialog";
import { DeclareIncompleteDialog, DeclareIncompleteForm } from "./DeclareIncompleteDialog";
import { ApplyDemonstrationTypesDialog } from "./DemonstrationTypes/ApplyDemonstrationTypesDialog";
import { ApplyTagsDialog } from "./ApplyTagsDialog";
import { RemoveDemonstrationTypesDialog } from "./DemonstrationTypes/RemoveDemonstrationTypesDialog";
import { EditDemonstrationTypeDialog } from "./DemonstrationTypes/EditDemonstrationTypeDialog";

type DialogContextType = {
  content: React.ReactNode | null;
  showDialog: (content: React.ReactNode) => void;
  hideDialog: () => void;
};

const DialogContext = createContext<DialogContextType | null>(null);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<React.ReactNode | null>(null);

  const showDialog = (dialogContent: React.ReactNode) => setContent(dialogContent);
  const hideDialog = () => setContent(null);

  return (
    <DialogContext.Provider value={{ content, showDialog, hideDialog }}>
      {children}
      {content}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within a DialogProvider");

  const showCreateDemonstrationDialog = () => {
    context.showDialog(<CreateDemonstrationDialog onClose={context.hideDialog} />);
  };

  const showEditDemonstrationDialog = (demonstrationId: string) => {
    context.showDialog(
      <EditDemonstrationDialog demonstrationId={demonstrationId} onClose={context.hideDialog} />
    );
  };

  const showCreateAmendmentDialog = (demonstrationId?: string) => {
    context.showDialog(<CreateAmendmentDialog demonstrationId={demonstrationId} />);
  };

  const showCreateExtensionDialog = (demonstrationId?: string) => {
    context.showDialog(<CreateExtensionDialog demonstrationId={demonstrationId} />);
  };

  const showManageContactsDialog = (
    demonstrationId: string,
    existingContacts?: ExistingContactType[]
  ) => {
    context.showDialog(
      <ManageContactsDialog
        demonstrationId={demonstrationId}
        existingContacts={existingContacts}
        onClose={context.hideDialog}
      />
    );
  };

  const showUploadDocumentDialog = (
    applicationId: string,
    onDocumentUploadSucceeded?: () => void
  ) => {
    context.showDialog(
      <AddDocumentDialog
        onClose={context.hideDialog}
        applicationId={applicationId}
        onDocumentUploadSucceeded={onDocumentUploadSucceeded}
      />
    );
  };

  const showEditDocumentDialog = (initialDocument: DocumentDialogFields) => {
    context.showDialog(
      <EditDocumentDialog initialDocument={initialDocument} onClose={context.hideDialog} />
    );
  };

  const showRemoveDocumentDialog = (documentIds: string[]) => {
    context.showDialog(
      <RemoveDocumentDialog documentIds={documentIds} onClose={context.hideDialog} />
    );
  };

  const showApplicationIntakeDocumentUploadDialog = (
    applicationId: string,
    onDocumentUploadSucceeded: () => void
  ) => {
    context.showDialog(
      <ApplicationIntakeUploadDialog
        onDocumentUploadSucceeded={onDocumentUploadSucceeded}
        onClose={context.hideDialog}
        applicationId={applicationId}
      />
    );
  };

  const showCompletenessDocumentUploadDialog = (
    applicationId: string,
    onDocumentUploadSucceeded?: (payload?: UploadDocumentInput) => void
  ) => {
    context.showDialog(
      <CompletenessDocumentUploadDialog
        onDocumentUploadSucceeded={onDocumentUploadSucceeded}
        onClose={context.hideDialog}
        applicationId={applicationId}
      />
    );
  };

  const showConceptPreSubmissionDocumentUploadDialog = (
    applicationId: string,
    onDocumentUploadSucceeded: () => void
  ) => {
    context.showDialog(
      <ConceptPreSubmissionUploadDialog
        onDocumentUploadSucceeded={onDocumentUploadSucceeded}
        onClose={context.hideDialog}
        applicationId={applicationId}
      />
    );
  };

  const showFederalCommentDocumentUploadDialog = (applicationId: string) => {
    context.showDialog(
      <FederalCommentUploadDialog onClose={context.hideDialog} applicationId={applicationId} />
    );
  };

  const showDeclareIncompleteDialog = (onConfirm: (form: DeclareIncompleteForm) => void) => {
    context.showDialog(
      <DeclareIncompleteDialog onConfirm={onConfirm} onClose={context.hideDialog} />
    );
  };

  const showApprovalPackageDocumentUploadDialog = (
    applicationId: string,
    documentType: DocumentType
  ) => {
    context.showDialog(
      <ApprovalPackageUploadDialog
        onClose={context.hideDialog}
        applicationId={applicationId}
        documentType={documentType}
      />
    );
  };

  const showApplyDemonstrationTypesDialog = (demonstrationId: string) => {
    context.showDialog(<ApplyDemonstrationTypesDialog demonstrationId={demonstrationId} />);
  };

  const showRemoveDemonstrationTypesDialog = (
    demonstrationId: string,
    demonstrationTypeNames: DemonstrationTypeName[]
  ) => {
    context.showDialog(
      <RemoveDemonstrationTypesDialog
        demonstrationId={demonstrationId}
        demonstrationTypeNames={demonstrationTypeNames}
      />
    );
  };

  const showEditDemonstrationTypeDialog = (
    demonstrationId: string,
    demonstrationType: Pick<
      DemonstrationTypeAssignment,
      "demonstrationTypeName" | "status" | "effectiveDate" | "expirationDate"
    >
  ) => {
    context.showDialog(
      <EditDemonstrationTypeDialog
        demonstrationId={demonstrationId}
        initialDemonstrationType={demonstrationType}
      />
    );
  };

  const showApplyTagsDialog = (
    demonstrationId: string,
    allTags: string[],
    selectedTags: string[]
  ) => {
    context.showDialog(
      <ApplyTagsDialog
        demonstrationId={demonstrationId}
        allTags={allTags}
        initiallySelectedTags={selectedTags}
        onClose={context.hideDialog}
      />
    );
  };

  return {
    closeDialog: context.hideDialog,
    showCreateDemonstrationDialog,
    showEditDemonstrationDialog,
    showCreateAmendmentDialog,
    showCreateExtensionDialog,
    showManageContactsDialog,
    showUploadDocumentDialog,
    showEditDocumentDialog,
    showRemoveDocumentDialog,
    showApplicationIntakeDocumentUploadDialog,
    showCompletenessDocumentUploadDialog,
    showConceptPreSubmissionDocumentUploadDialog,
    showFederalCommentDocumentUploadDialog,
    showApprovalPackageDocumentUploadDialog,
    showDeclareIncompleteDialog,
    showApplyDemonstrationTypesDialog,
    showApplyTagsDialog,
    showRemoveDemonstrationTypesDialog,
    showEditDemonstrationTypeDialog,
  };
};
