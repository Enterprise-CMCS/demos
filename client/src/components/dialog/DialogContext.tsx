import React, { createContext, useContext, useState } from "react";
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
} from "./document/DocumentDialog";
import { ApplicationIntakeUploadDialog } from "./document/ApplicationIntakeUploadDialog";
import { CompletenessDocumentUploadDialog } from "./document/CompletenessDocumentUploadDialog";
import { ConceptPreSubmissionUploadDialog } from "./document/ConceptPreSubmissionUploadDialog";
import { FederalCommentUploadDialog } from "./document/FederalCommentUploadDialog";
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
    context.showDialog(<CreateDemonstrationDialog onClose={context.hideDialog} />);
  };

  const showEditDemonstrationDialog = (demonstrationId: string) => {
    context.showDialog(
      <EditDemonstrationDialog demonstrationId={demonstrationId} onClose={context.hideDialog} />
    );
  };

  const showCreateAmendmentDialog = (demonstrationId?: string) => {
    context.showDialog(
      <CreateAmendmentDialog
        initialDemonstrationId={demonstrationId}
        onClose={context.hideDialog}
      />
    );
  };

  const showCreateExtensionDialog = (demonstrationId?: string) => {
    context.showDialog(
      <CreateExtensionDialog
        initialDemonstrationId={demonstrationId}
        onClose={context.hideDialog}
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
        onClose={context.hideDialog}
      />
    );
  };

  const showUploadDocumentDialog = (applicationId: string) => {
    context.showDialog(
      <AddDocumentDialog onClose={context.hideDialog} applicationId={applicationId} />
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

  const showCompletenessDocumentUploadDialog = (applicationId: string) => {
    context.showDialog(
      <CompletenessDocumentUploadDialog
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

  return {
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
    showDeclareIncompleteDialog,
  };
};
