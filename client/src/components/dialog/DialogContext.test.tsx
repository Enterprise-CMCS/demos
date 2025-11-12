import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DialogProvider, useDialog } from "./DialogContext";
import { ExistingContactType } from "./ManageContactsDialog";
import { DocumentDialogFields } from "./document/DocumentDialog";
import { DeclareIncompleteForm } from "./DeclareIncompleteDialog";

const MockDialog = ({ onClose }: { onClose: () => void }) => (
  <div data-testid="mock-dialog">
    Mock Dialog
    <button data-testid="close-btn" onClick={onClose}>
      Close
    </button>
  </div>
);

// Patch DialogContext to use MockDialog for testing
vi.mock("./demonstration/CreateDemonstrationDialog", () => ({
  CreateDemonstrationDialog: ({ onClose }: { onClose: () => void }) => (
    <MockDialog onClose={onClose} />
  ),
}));
vi.mock("./demonstration", () => ({
  EditDemonstrationDialog: ({
    demonstrationId,
    onClose,
  }: {
    demonstrationId: string;
    onClose: () => void;
  }) => (
    <div data-testid="edit-dialog">
      Edit Dialog {demonstrationId}
      <button data-testid="close-edit-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));
vi.mock("./AmendmentDialog", () => ({
  AmendmentDialog: ({
    demonstrationId,
    mode,
    onClose,
  }: {
    demonstrationId?: string;
    mode: string;
    onClose: () => void;
  }) => (
    <div data-testid="amendment-dialog">
      Amendment Dialog {demonstrationId} {mode}
      <button data-testid="close-amendment-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));
vi.mock("./ExtensionDialog", () => ({
  ExtensionDialog: ({
    demonstrationId,
    mode,
    onClose,
  }: {
    demonstrationId?: string;
    mode: string;
    onClose: () => void;
  }) => (
    <div data-testid="extension-dialog">
      Extension Dialog {demonstrationId} {mode}
      <button data-testid="close-extension-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("./ManageContactsDialog", () => ({
  ManageContactsDialog: ({
    demonstrationId,
    existingContacts,
    onClose,
  }: {
    demonstrationId: string;
    existingContacts?: ExistingContactType[];
    onClose: () => void;
  }) => (
    <div data-testid="manage-contacts-dialog">
      Manage Contacts Dialog {demonstrationId} {existingContacts?.length ?? 0}
      <button data-testid="close-contacts-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));
vi.mock("./document/DocumentDialog", () => ({
  AddDocumentDialog: ({
    onClose,
    applicationId,
  }: {
    onClose: () => void;
    applicationId: string;
  }) => (
    <div data-testid="add-document-dialog">
      Add Document Dialog {applicationId}
      <button data-testid="close-add-document-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
  EditDocumentDialog: ({
    initialDocument,
    onClose,
  }: {
    initialDocument: { id: string };
    onClose: () => void;
  }) => (
    <div data-testid="edit-document-dialog">
      Edit Document Dialog {initialDocument.id}
      <button data-testid="close-edit-document-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
  RemoveDocumentDialog: ({
    documentIds,
    onClose,
  }: {
    documentIds: string[];
    onClose: () => void;
  }) => (
    <div data-testid="remove-document-dialog">
      Remove Document Dialog {documentIds.join(",")}
      <button data-testid="close-remove-document-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("./document/ApplicationIntakeUploadDialog", () => ({
  ApplicationIntakeUploadDialog: ({
    applicationId,
    onDocumentUploadSucceeded,
    onClose,
  }: {
    applicationId: string;
    onDocumentUploadSucceeded: () => void;
    onClose: () => void;
  }) => (
    <div data-testid="application-intake-upload-dialog">
      Application Intake Upload Dialog {applicationId}
      <button data-testid="upload-succeeded-btn" onClick={onDocumentUploadSucceeded}>
        Upload Succeeded
      </button>
      <button data-testid="close-application-intake-upload-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("./document/CompletenessDocumentUploadDialog", () => ({
  CompletenessDocumentUploadDialog: ({
    applicationId,
    onClose,
  }: {
    applicationId: string;
    onClose: () => void;
  }) => (
    <div data-testid="completeness-upload-dialog">
      Completeness Upload Dialog {applicationId}
      <button data-testid="close-completeness-upload-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("./document/ConceptPreSubmissionUploadDialog", () => ({
  ConceptPreSubmissionUploadDialog: ({
    applicationId,
    onDocumentUploadSucceeded,
    onClose,
  }: {
    applicationId: string;
    onDocumentUploadSucceeded: () => void;
    onClose: () => void;
  }) => (
    <div data-testid="concept-pre-upload-dialog">
      Concept Pre-Submission Upload Dialog {applicationId}
      <button data-testid="upload-succeeded-btn" onClick={onDocumentUploadSucceeded}>
        Upload Succeeded
      </button>
      <button data-testid="close-concept-pre-upload-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("./document/FederalCommentUploadDialog", () => ({
  FederalCommentUploadDialog: ({
    applicationId,
    onClose,
  }: {
    applicationId: string;
    onClose: () => void;
  }) => (
    <div data-testid="federal-comment-upload-dialog">
      Federal Comment Upload Dialog {applicationId}
      <button data-testid="close-federal-comment-upload-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("./DeclareIncompleteDialog", () => ({
  DeclareIncompleteDialog: ({
    onConfirm,
    onClose,
  }: {
    onConfirm: (form: DeclareIncompleteForm) => void;
    onClose: () => void;
  }) => (
    <div data-testid="declare-incomplete-dialog">
      Declare Incomplete Dialog
      <button
        data-testid="confirm-declare-incomplete-btn"
        onClick={() => onConfirm({ reason: "missing-documentation", otherText: undefined })}
      >
        Confirm
      </button>
      <button data-testid="close-declare-incomplete-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

const mockRoles: ExistingContactType[] = [
  {
    role: "Project Officer",
    isPrimary: true,
    person: { id: "person-1", fullName: "Person One", email: "person.one@email.com" },
  },
  {
    role: "DDME Analyst",
    isPrimary: false,
    person: { id: "person-2", fullName: "Person Two", email: "person.two@email.com" },
  },
];

const mockExistingDocument: DocumentDialogFields = {
  id: "doc-1",
  name: "Document 1",
  file: null,
  documentType: "Application Completeness Letter",
};

const TestConsumer: React.FC = () => {
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
    showDeclareIncompleteDialog,
  } = useDialog();

  return (
    <div>
      <button data-testid="open-create-btn" onClick={showCreateDemonstrationDialog}>
        Open Create Dialog
      </button>
      <button data-testid="open-edit-btn" onClick={() => showEditDemonstrationDialog("demo-id")}>
        Open Edit Dialog
      </button>
      <button data-testid="open-amendment-btn" onClick={() => showCreateAmendmentDialog("demo-id")}>
        Open Amendment Dialog
      </button>
      <button data-testid="open-extension-btn" onClick={() => showCreateExtensionDialog("demo-id")}>
        Open Extension Dialog
      </button>
      <button
        data-testid="open-contacts-btn"
        onClick={() => showManageContactsDialog("demo-id", mockRoles)}
      >
        Open Manage Contacts Dialog
      </button>
      <button data-testid="open-add-document-btn" onClick={() => showUploadDocumentDialog("app-1")}>
        Open Add Document Dialog
      </button>
      <button
        data-testid="open-edit-document-btn"
        onClick={() => showEditDocumentDialog(mockExistingDocument)}
      >
        Open Edit Document Dialog
      </button>
      <button
        data-testid="open-remove-document-btn"
        onClick={() => showRemoveDocumentDialog(["doc-1", "doc-2"])}
      >
        Open Remove Document Dialog
      </button>
      <button
        data-testid="open-application-intake-upload-btn"
        onClick={() => showApplicationIntakeDocumentUploadDialog("app-2", vi.fn())}
      >
        Open Application Intake Upload Dialog
      </button>
      <button
        data-testid="open-completeness-upload-btn"
        onClick={() => showCompletenessDocumentUploadDialog("app-3")}
      >
        Open Completeness Upload Dialog
      </button>
      <button
        data-testid="open-concept-pre-upload-btn"
        onClick={() => showConceptPreSubmissionDocumentUploadDialog("app-4", vi.fn())}
      >
        Open Concept Pre-Submission Upload Dialog
      </button>
      <button
        data-testid="open-federal-comment-upload-btn"
        onClick={() => showFederalCommentDocumentUploadDialog("app-5")}
      >
        Open Federal Comment Upload Dialog
      </button>
      <button
        data-testid="open-declare-incomplete-btn"
        onClick={() => showDeclareIncompleteDialog(vi.fn())}
      >
        Open Declare Incomplete Dialog
      </button>
    </div>
  );
};

describe("DialogContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children", () => {
    render(
      <DialogProvider>
        <div data-testid="child">Child Content</div>
      </DialogProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows and hides CreateDemonstrationDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("mock-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-create-btn"));
    expect(screen.getByTestId("mock-dialog")).toBeInTheDocument();

    await user.click(screen.getByTestId("close-btn"));
    expect(screen.queryByTestId("mock-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides EditDemonstrationDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("edit-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-edit-btn"));
    expect(screen.getByTestId("edit-dialog")).toBeInTheDocument();

    await user.click(screen.getByTestId("close-edit-btn"));
    expect(screen.queryByTestId("edit-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides AmendmentDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("amendment-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-amendment-btn"));
    expect(screen.getByTestId("amendment-dialog")).toBeInTheDocument();

    await user.click(screen.getByTestId("close-amendment-btn"));
    expect(screen.queryByTestId("amendment-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides ExtensionDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("extension-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-extension-btn"));
    expect(screen.getByTestId("extension-dialog")).toBeInTheDocument();

    await user.click(screen.getByTestId("close-extension-btn"));
    expect(screen.queryByTestId("extension-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides ManageContactsDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("manage-contacts-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-contacts-btn"));
    expect(screen.getByTestId("manage-contacts-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Manage Contacts Dialog demo-id 2/)).toBeInTheDocument();

    await user.click(screen.getByTestId("close-contacts-btn"));
    expect(screen.queryByTestId("manage-contacts-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides AddDocumentDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("add-document-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-add-document-btn"));
    expect(screen.getByTestId("add-document-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Add Document Dialog app-1/)).toBeInTheDocument();

    await user.click(screen.getByTestId("close-add-document-btn"));
    expect(screen.queryByTestId("add-document-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides EditDocumentDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("edit-document-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-edit-document-btn"));
    expect(screen.getByTestId("edit-document-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Edit Document Dialog doc-1/)).toBeInTheDocument();

    await user.click(screen.getByTestId("close-edit-document-btn"));
    expect(screen.queryByTestId("edit-document-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides RemoveDocumentDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("remove-document-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-remove-document-btn"));
    expect(screen.getByTestId("remove-document-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Remove Document Dialog doc-1,doc-2/)).toBeInTheDocument();

    await user.click(screen.getByTestId("close-remove-document-btn"));
    expect(screen.queryByTestId("remove-document-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides ApplicationIntakeUploadDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("application-intake-upload-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-application-intake-upload-btn"));
    expect(screen.getByTestId("application-intake-upload-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Application Intake Upload Dialog app-2/)).toBeInTheDocument();

    await user.click(screen.getByTestId("close-application-intake-upload-btn"));
    expect(screen.queryByTestId("application-intake-upload-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides CompletenessDocumentUploadDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("completeness-upload-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-completeness-upload-btn"));
    expect(screen.getByTestId("completeness-upload-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Completeness Upload Dialog app-3/)).toBeInTheDocument();

    await user.click(screen.getByTestId("close-completeness-upload-btn"));
    expect(screen.queryByTestId("completeness-upload-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides ConceptPreSubmissionUploadDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("concept-pre-upload-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-concept-pre-upload-btn"));
    expect(screen.getByTestId("concept-pre-upload-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Concept Pre-Submission Upload Dialog app-4/)).toBeInTheDocument();

    await user.click(screen.getByTestId("close-concept-pre-upload-btn"));
    expect(screen.queryByTestId("concept-pre-upload-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides FederalCommentUploadDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("federal-comment-upload-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-federal-comment-upload-btn"));
    expect(screen.getByTestId("federal-comment-upload-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Federal Comment Upload Dialog app-5/)).toBeInTheDocument();

    await user.click(screen.getByTestId("close-federal-comment-upload-btn"));
    expect(screen.queryByTestId("federal-comment-upload-dialog")).not.toBeInTheDocument();
  });
  it("shows and hides DeclareIncompleteDialog via context and calls onConfirm", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("declare-incomplete-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-declare-incomplete-btn"));
    expect(screen.getByTestId("declare-incomplete-dialog")).toBeInTheDocument();
    
    await user.click(screen.getByTestId("close-declare-incomplete-btn"));
    expect(screen.queryByTestId("declare-incomplete-dialog")).not.toBeInTheDocument();
  });
});
