import React, { createContext, useContext, useState } from "react";
import { DocumentNode } from "@apollo/client";
import {
  DocumentType,
  TagName,
  DemonstrationTypeAssignment,
  Tag,
  Reference,
  ReferenceAgreement,
  Document as ServerDocument,
} from "demos-server";
import { CreateDemonstrationDialog } from "./demonstration";
import { CreateAmendmentDialog } from "./modification/CreateAmendmentDialog";
import { CreateExtensionDialog } from "./modification/CreateExtensionDialog";
import { EditDemonstrationDialog } from "./demonstration";
import { ExistingContactType, ManageContactsDialog } from "./ManageContactsDialog";
import {
  AddDocumentToApplicationDialog,
  AddDocumentToDeliverableDialog,
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
import { UpdateExtensionDialog } from "./modification/EditExtensionDialog";
import { UpdateAmendmentDialog } from "./modification/EditAmendmentDialog";
import { ConfirmApproveDialog } from "./ConfirmApproveDialog";
import { AddDeliverableSlotDialog, RemoveDeliverableDialog } from "./deliverable";
import { EditDeliverableDialog } from "./deliverable/EditDeliverableDialog";
import {
  RequestExtensionDeliverableDialog,
  RequestExtensionDeliverableDialogDeliverable,
} from "./deliverable/RequestExtensionDeliverableDialog";
import type {
  EditDeliverableDialogDeliverable,
  EditDeliverableInput,
} from "./deliverable/EditDeliverableDialog";
import { WorkflowApplicationType } from "components/application";
import { AddDeliverableSlotDemonstration } from "./deliverable/AddDeliverableSlotDialog";
import type { DeliverableTableRow } from "components/table/tables/DeliverableTable";
import {
  RequestResubmissionDeliverableDialog,
  RequestResubmissionDeliverableDialogDeliverable,
} from "./deliverable/RequestResubmissionDeliverableDialog";
import {
  CompleteReviewDeliverableDialog,
  CompleteReviewDeliverableDialogDeliverable,
} from "./deliverable/CompleteReviewDeliverableDialog";
import {
  ReviewExtensionDeliverableDialog,
  ReviewExtensionDeliverableDialogDeliverable,
} from "./deliverable/ReviewExtensionDeliverableDialog";
import { ReferenceAgreementDialog } from "./referenceAgreement/ReferenceAgreementDialog";

type EditDeliverableDialogSource = Pick<
  DeliverableTableRow,
  | "id"
  | "name"
  | "deliverableType"
  | "dueDate"
  | "cmsOwner"
  | "demonstrationTypes"
  | "demonstration"
>;

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
    context.showDialog(<EditDemonstrationDialog demonstrationId={demonstrationId} />);
  };

  const showCreateAmendmentDialog = (demonstrationId?: string) => {
    context.showDialog(<CreateAmendmentDialog demonstrationId={demonstrationId} />);
  };

  const showCreateExtensionDialog = (demonstrationId?: string) => {
    context.showDialog(<CreateExtensionDialog demonstrationId={demonstrationId} />);
  };

  const showUpdateExtensionDialog = (extensionId: string, refetchQueries: string[] = []) => {
    context.showDialog(
      <UpdateExtensionDialog extensionId={extensionId} refetchQueries={refetchQueries} />
    );
  };

  const showUpdateAmendmentDialog = (amendmentId: string, refetchQueries: string[] = []) => {
    context.showDialog(
      <UpdateAmendmentDialog amendmentId={amendmentId} refetchQueries={refetchQueries} />
    );
  };

  const showManageContactsDialog = (
    demonstrationId: string,
    stateId: string,
    existingContacts?: ExistingContactType[]
  ) => {
    context.showDialog(
      <ManageContactsDialog
        demonstrationId={demonstrationId}
        stateId={stateId}
        existingContacts={existingContacts}
        onClose={context.hideDialog}
      />
    );
  };

  const showUploadDocumentDialog = (
    applicationId: string,
    onDocumentUploadSucceeded?: () => void,
    documentTypeSubset?: DocumentType[]
  ) => {
    context.showDialog(
      <AddDocumentToApplicationDialog
        onClose={context.hideDialog}
        applicationId={applicationId}
        onDocumentUploadSucceeded={onDocumentUploadSucceeded}
        documentTypeSubset={documentTypeSubset}
      />
    );
  };

  const showEditDocumentDialog = (
    document: Pick<ServerDocument, "id" | "name" | "description">,
    refetchQueries?: DocumentNode[]
  ) => {
    context.showDialog(<EditDocumentDialog document={document} refetchQueries={refetchQueries} />);
  };

  const showRemoveDocumentDialog = (
    documentIds: string[],
    options: { refetchQueries?: DocumentNode[] } = {}
  ) => {
    context.showDialog(
      <RemoveDocumentDialog
        documentIds={documentIds}
        onClose={context.hideDialog}
        refetchQueries={options.refetchQueries}
      />
    );
  };

  const showAddDeliverableFileDialog = (args: {
    deliverableId: string;
    applicationId: string;
    isCmsFile: boolean;
    documentTypeSubset?: DocumentType[];
    refetchQueries?: string[];
  }) => {
    context.showDialog(<AddDocumentToDeliverableDialog onClose={context.hideDialog} {...args} />);
  };

  const showApplicationIntakeDocumentUploadDialog = (applicationId: string) => {
    context.showDialog(
      <ApplicationIntakeUploadDialog onClose={context.hideDialog} applicationId={applicationId} />
    );
  };

  const showCompletenessDocumentUploadDialog = (applicationId: string) => {
    context.showDialog(
      <CompletenessDocumentUploadDialog
        applicationId={applicationId}
        onClose={context.hideDialog}
      />
    );
  };

  const showConceptPreSubmissionDocumentUploadDialog = (applicationId: string) => {
    context.showDialog(
      <ConceptPreSubmissionUploadDialog
        applicationId={applicationId}
        onClose={context.hideDialog}
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
    demonstrationTypeNames: TagName[]
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
      "demonstrationTypeName" | "status" | "effectiveDate" | "expirationDate" | "approvalStatus"
    >
  ) => {
    context.showDialog(
      <EditDemonstrationTypeDialog
        demonstrationId={demonstrationId}
        initialDemonstrationType={demonstrationType}
      />
    );
  };

  const showApplyTagsDialog = (demonstrationId: string, allTags: Tag[], selectedTags: Tag[]) => {
    context.showDialog(
      <ApplyTagsDialog
        demonstrationId={demonstrationId}
        allTags={allTags}
        initiallySelectedTags={selectedTags}
        onClose={context.hideDialog}
      />
    );
  };

  const showConfirmApproveDialog = (
    onConfirm: () => void,
    applicationType: WorkflowApplicationType
  ) => {
    context.showDialog(
      <ConfirmApproveDialog onConfirm={onConfirm} applicationType={applicationType} />
    );
  };

  const showAddDeliverableSlotDialog = (demonstration: AddDeliverableSlotDemonstration) => {
    context.showDialog(
      <AddDeliverableSlotDialog onClose={context.hideDialog} demonstration={demonstration} />
    );
  };

  const showRemoveDeliverableDialog = (deliverableIds: string[], onDeleted?: () => void) => {
    context.showDialog(
      <RemoveDeliverableDialog
        deliverableIds={deliverableIds}
        onClose={context.hideDialog}
        onDeleted={onDeleted}
      />
    );
  };

  const showRequestExtensionDeliverableDialog = (
    deliverable: RequestExtensionDeliverableDialogDeliverable
  ) => {
    context.showDialog(
      <RequestExtensionDeliverableDialog onClose={context.hideDialog} deliverable={deliverable} />
    );
  };

  const showRequestResubmissionDeliverableDialog = (
    deliverable: RequestResubmissionDeliverableDialogDeliverable
  ) => {
    context.showDialog(
      <RequestResubmissionDeliverableDialog
        onClose={context.hideDialog}
        deliverable={deliverable}
      />
    );
  };

  const showCompleteReviewDeliverableDialog = (
    deliverable: CompleteReviewDeliverableDialogDeliverable
  ) => {
    context.showDialog(
      <CompleteReviewDeliverableDialog onClose={context.hideDialog} deliverable={deliverable} />
    );
  };

  const showReviewExtensionDeliverableDialog = (
    deliverable: ReviewExtensionDeliverableDialogDeliverable
  ) => {
    context.showDialog(
      <ReviewExtensionDeliverableDialog onClose={context.hideDialog} deliverable={deliverable} />
    );
  };

  const showEditDeliverableDialog = (
    deliverable: EditDeliverableDialogSource,
    onSave?: (input: EditDeliverableInput, reasonForChange?: string) => Promise<void> | void
  ) => {
    const dialogDeliverable: EditDeliverableDialogDeliverable = {
      id: deliverable.id,
      name: deliverable.name,
      deliverableType: deliverable.deliverableType,
      dueDate: deliverable.dueDate,
      cmsOwner: { id: deliverable.cmsOwner.id },
      demonstrationTypes: deliverable.demonstrationTypes,
    };
    const demonstrationTypeTags: Tag[] = deliverable.demonstration.demonstrationTypes.map(
      (dt: { demonstrationTypeName: string; approvalStatus: "Approved" | "Unapproved" }) => ({
        tagName: dt.demonstrationTypeName,
        approvalStatus: dt.approvalStatus,
      })
    );

    context.showDialog(
      <EditDeliverableDialog
        onClose={context.hideDialog}
        deliverable={dialogDeliverable}
        demonstrationTypeTags={demonstrationTypeTags}
        onSave={onSave}
      />
    );
  };

  const showReferenceAgreementDialog = (
    reference: Pick<Reference, "id"> & {
      agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt">;
    }
  ) => {
    context.showDialog(<ReferenceAgreementDialog reference={reference} />);
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
    showAddDeliverableFileDialog,
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
    showUpdateExtensionDialog,
    showUpdateAmendmentDialog,
    showConfirmApproveDialog,
    showAddDeliverableSlotDialog,
    showRemoveDeliverableDialog,
    showEditDeliverableDialog,
    showRequestExtensionDeliverableDialog,
    showRequestResubmissionDeliverableDialog,
    showCompleteReviewDeliverableDialog,
    showReviewExtensionDeliverableDialog,
    showReferenceAgreementDialog,
  };
};
