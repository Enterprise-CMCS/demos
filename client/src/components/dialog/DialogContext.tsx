import React, { createContext, useContext, useState } from "react";
import { DocumentType } from "demos-server";
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
    context.showDialog(<CreateDemonstrationDialog />);
  };

  const showEditDemonstrationDialog = (demonstrationId: string) => {
    context.showDialog(
      <EditDemonstrationDialog demonstrationId={demonstrationId} />
    );
  };

  const showCreateAmendmentDialog = (demonstrationId?: string) => {
    context.showDialog(
      <CreateAmendmentDialog
        initialDemonstrationId={demonstrationId}
      />
    );
  };

  const showCreateExtensionDialog = (demonstrationId?: string) => {
    context.showDialog(
      <CreateExtensionDialog
        initialDemonstrationId={demonstrationId}
      />
    );
  };

  const showManageContactsDialog = (
    demonstrationId: string,
    existingContacts?: ExistingContactType[]
  ) => {
    context.showDialog(
      <ManageContactsDialog
        demonstrationId={demonstrationId}
        existingContacts={existingContacts}
      />
    );
  };

  const showUploadDocumentDialog = (applicationId: string) => {
    context.showDialog(
      <AddDocumentDialog applicationId={applicationId} />
    );
  };

  const showEditDocumentDialog = (initialDocument: DocumentDialogFields) => {
    context.showDialog(
      <EditDocumentDialog initialDocument={initialDocument} />
    );
  };

  const showRemoveDocumentDialog = (documentIds: string[]) => {
    context.showDialog(
      <RemoveDocumentDialog documentIds={documentIds} />
    );
  };

  const showApplicationIntakeDocumentUploadDialog = (
    applicationId: string,
    onDocumentUploadSucceeded: () => void
  ) => {
    context.showDialog(
      <ApplicationIntakeUploadDialog
        onDocumentUploadSucceeded={onDocumentUploadSucceeded}
        applicationId={applicationId}
      />
    );
  };

  const showCompletenessDocumentUploadDialog = (applicationId: string) => {
    context.showDialog(
      <CompletenessDocumentUploadDialog
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
        applicationId={applicationId}
      />
    );
  };

  const showFederalCommentDocumentUploadDialog = (applicationId: string) => {
    context.showDialog(
      <FederalCommentUploadDialog applicationId={applicationId} />
    );
  };

  const showDeclareIncompleteDialog = (onConfirm: (form: DeclareIncompleteForm) => void) => {
    context.showDialog(
      <DeclareIncompleteDialog onConfirm={onConfirm} />
    );
  };

  const showApprovalPackageDocumentUploadDialog = (
    applicationId: string,
    documentType: DocumentType
  ) => {
    context.showDialog(
      <ApprovalPackageUploadDialog
        applicationId={applicationId}
        documentType={documentType}
      />
    );
  };

  return {
    hideDialog: context.hideDialog,
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
  };
};
