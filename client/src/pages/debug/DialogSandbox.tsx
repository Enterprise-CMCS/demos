import React from "react";
import { useDialog } from "components/dialog/DialogContext";
import { Button } from "components/button";
import { DocumentType } from "demos-server";
import { ExistingContactType } from "components/dialog/ManageContactsDialog";

export const DialogSandbox: React.FC = () => {
  const {
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
  } = useDialog();

  const ID = "1";

  const EXISTING_CONTACTS: ExistingContactType[] = [
    {
      id: "contact-1",
      role: "Project Officer",
      isPrimary: true,
      person: {
        id: "person-1",
        fullName: "Alice Anderson",
        email: "alice.anderson@example.com",
        personType: "non-user-contact",
      },
    },
    {
      id: "contact-2",
      role: "Project Officer",
      isPrimary: false,
      person: {
        id: "person-2",
        fullName: "Bob Brown",
        email: "bob.brown@example.com",
        personType: "non-user-contact",
      },
    },
  ];

  return (
    <div className="flex flex-col gap-2 p-2">
      <h2 className="text-xl font-bold">Dialog Sandbox</h2>

      <div className="flex flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Application Dialogs</h3>
        <Button name="create-demonstration" onClick={showCreateDemonstrationDialog}>
          Create Demonstration
        </Button>
        <Button name="edit-demonstration" onClick={() => showEditDemonstrationDialog(ID)}>
          Edit Demonstration
        </Button>
        <Button name="create-amendment" onClick={() => showCreateAmendmentDialog(ID)}>
          Create Amendment
        </Button>
        <Button name="create-extension" onClick={() => showCreateExtensionDialog(ID)}>
          Create Extension
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Document Dialogs</h3>

        <Button name="upload-document" onClick={() => showUploadDocumentDialog(ID)}>
          Upload Document
        </Button>
        <Button
          name="edit-document"
          onClick={() =>
            showEditDocumentDialog({
              id: ID,
              name: "foo",
              description: "",
              documentType: "Other" as DocumentType,
              file: null,
            })
          }
        >
          Edit Document
        </Button>
        <Button name="remove-document" onClick={() => showRemoveDocumentDialog([ID])}>
          Remove Document
        </Button>
        <Button
          name="application-intake"
          onClick={() => showApplicationIntakeDocumentUploadDialog(ID, () => {})}
        >
          Application Intake
        </Button>
        <Button name="completeness" onClick={() => showCompletenessDocumentUploadDialog(ID)}>
          Completeness
        </Button>
        <Button
          name="concept-presubmission"
          onClick={() => showConceptPreSubmissionDocumentUploadDialog(ID, () => {})}
        >
          Concept Pre-Submission
        </Button>
        <Button name="federal-comment" onClick={() => showFederalCommentDocumentUploadDialog(ID)}>
          Federal Comment
        </Button>
        <Button
          name="approval-package"
          onClick={() =>
            showApprovalPackageDocumentUploadDialog(ID, "Permit Application" as DocumentType)
          }
        >
          Approval Package
        </Button>
        <div className="flex flex-wrap gap-2">
          <h3 className="text-lg font-semibold">Miscellaneous Dialogs</h3>
          <Button name="declare-incomplete" onClick={() => showDeclareIncompleteDialog(() => {})}>
            Declare Incomplete
          </Button>
          <Button
            name="manage-contacts"
            onClick={() => showManageContactsDialog(ID, EXISTING_CONTACTS)}
          >
            Manage Contacts
          </Button>
        </div>
      </div>
    </div>
  );
};
