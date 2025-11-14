import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

import { ConceptPreSubmissionUploadDialog } from "./ConceptPreSubmissionUploadDialog";

// Mock Apollo Client
const mockMutation = vi.fn();
vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useMutation: () => [mockMutation, { loading: false }],
  };
});

const defaultProps = {
  onClose: vi.fn(),
  onDocumentUploadSucceeded: vi.fn(),
  applicationId: "test-application-id",
};

function setup(props = {}) {
  const finalProps = { ...defaultProps, ...props };
  return render(
    <TestProvider>
      <ConceptPreSubmissionUploadDialog {...finalProps} />
    </TestProvider>
  );
}

describe("ConceptPreSubmissionUploadDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders dialog content when open", () => {
      setup();
      expect(screen.getByText("Pre-Submission Document")).toBeInTheDocument();
    });

    it("renders upload interface elements", () => {
      setup();
      expect(screen.getByText("Drop file(s) to upload")).toBeInTheDocument();
      expect(screen.getByText("Select File(s)")).toBeInTheDocument();
    });

    it("renders form fields", () => {
      setup();
      expect(screen.getByText("Document Title")).toBeInTheDocument();
      expect(screen.getByText("Document Description")).toBeInTheDocument();
      expect(screen.getByText("Document Type")).toBeInTheDocument();
    });

    it("renders action buttons", () => {
      setup();
      expect(screen.getByTestId("button-confirm-upload-document")).toBeInTheDocument();
      expect(screen.getByTestId("button-cancel-upload-document")).toBeInTheDocument();
    });
  });

  describe("Form Elements", () => {
    it("has title input field", () => {
      setup();
      expect(screen.getByTestId("title")).toBeInTheDocument();
    });

    it("has file input", () => {
      setup();
      expect(screen.getByTestId("input-file")).toBeInTheDocument();
    });

    it("has document type selector", () => {
      setup();
      expect(screen.getByTestId("input-autocomplete-select")).toBeInTheDocument();
    });

    it("has proper upload button state", () => {
      setup();
      const uploadButton = screen.getByTestId("button-confirm-upload-document");
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton).toBeDisabled(); // Should be disabled initially
    });
  });

  describe("Content Display", () => {
    it("shows file size limit information", () => {
      setup();
      expect(screen.getByText(/600/)).toBeInTheDocument();
      expect(screen.getByText(/MB/)).toBeInTheDocument();
    });

    it("shows allowed file types", () => {
      setup();
      expect(screen.getByText(/\.pdf/)).toBeInTheDocument();
      expect(screen.getByText(/\.doc/)).toBeInTheDocument();
    });

    it("has close button", () => {
      setup();
      expect(screen.getByLabelText("Close dialog")).toBeInTheDocument();
    });
  });

  describe("Pre-submission Configuration", () => {
    it("displays pre-submission document type by default", () => {
      setup();
      expect(screen.getByDisplayValue("Pre-Submission")).toBeInTheDocument();
    });

    it("shows pre-submission specific title", () => {
      setup();
      expect(screen.getByText("Pre-Submission Document")).toBeInTheDocument();
    });
  });
});
