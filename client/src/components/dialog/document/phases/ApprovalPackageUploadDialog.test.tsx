import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, beforeEach, vi, expect } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { ApprovalPackageUploadDialog } from "./ApprovalPackageUploadDialog";
import { DocumentType } from "demos-server";
import { CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";

interface MockAddDocumentDialogProps {
  titleOverride: string;
  documentTypeSubset: DocumentType[];
  phaseName: string;
}

// Mock Apollo Client
const mockMutation = vi.fn();
vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useMutation: () => [mockMutation, { loading: false }],
  };
});

// Mock AddDocumentDialog
vi.mock("components/dialog/document", () => ({
  AddDocumentDialog: ({
    titleOverride,
    documentTypeSubset,
    phaseName,
  }: MockAddDocumentDialogProps) => (
    <div>
      <div data-testid="add-document-dialog">{titleOverride}</div>
      <div data-testid="document-type">{documentTypeSubset.join(",")}</div>
      <div data-testid="phase-name">{phaseName}</div>
      <button data-testid="button-confirm-upload-document">Upload</button>
      <button data-testid={CANCEL_BUTTON_NAME}>Cancel</button>
    </div>
  ),
}));

const defaultProps = {
  onClose: vi.fn(),
  applicationId: "test-application-id",
  documentType: "Approval Letter" as DocumentType,
};

function setup(props = {}) {
  const finalProps = { ...defaultProps, ...props };
  return render(
    <TestProvider>
      <ApprovalPackageUploadDialog {...finalProps} />
    </TestProvider>
  );
}

describe("ApprovalPackageUploadDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders the dialog title", () => {
      setup();
      expect(screen.getByTestId("add-document-dialog")).toHaveTextContent(
        "Add Approval Package Document(s)"
      );
    });

    it("renders the provided document type", () => {
      setup();
      expect(screen.getByTestId("document-type")).toHaveTextContent("Approval Letter");
    });

    it("renders the phase name", () => {
      setup();
      expect(screen.getByTestId("phase-name")).toHaveTextContent("Approval Package");
    });

    it("renders action buttons", () => {
      setup();
      expect(screen.getByTestId("button-confirm-upload-document")).toBeInTheDocument();
      expect(screen.getByTestId(CANCEL_BUTTON_NAME)).toBeInTheDocument();
    });
  });
});
