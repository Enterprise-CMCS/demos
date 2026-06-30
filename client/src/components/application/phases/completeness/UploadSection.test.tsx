import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { UploadSection } from "./UploadSection";
import { ApplicationWorkflowDocument } from "components/application";
import { TZDate } from "@date-fns/tz";
import { EST_TIMEZONE } from "util/formatDate";
import {
  COMPLETENESS_PHASE_STEP_ONE_DESCRIPTION,
  COMPLETENESS_UPLOAD_BUTTON_NAME,
} from "./CompletenessPhase";

const mockCompletenessDoc: ApplicationWorkflowDocument = {
  id: "doc-1",
  name: "Completeness Letter",
  description: "Test letter",
  documentType: "Application Completeness Letter",
  phaseName: "Completeness",
  owner: { person: { fullName: "Jane Doe" } },
  createdAt: new TZDate("2026-02-01", EST_TIMEZONE),
};

const mockInternalDoc: ApplicationWorkflowDocument = {
  id: "doc-2",
  name: "Internal Form",
  description: "Internal form",
  documentType: "Internal Completeness Review Form",
  phaseName: "Completeness",
  owner: { person: { fullName: "John Smith" } },
  createdAt: new TZDate("2026-02-02", EST_TIMEZONE),
};

const mockShowCompletenessDocumentUploadDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCompletenessDocumentUploadDialog: mockShowCompletenessDocumentUploadDialog,
  }),
}));

describe("UploadSection", () => {
  const setup = (completenessDocuments: ApplicationWorkflowDocument[] = []) => {
    render(
      <TestProvider>
        <UploadSection applicationId="app-123" completenessDocuments={completenessDocuments} />
      </TestProvider>
    );
  };

  it("renders upload button and helper text", () => {
    setup();
    expect(screen.getByText("Step 1 - Upload")).toBeInTheDocument();
    expect(screen.getByTestId(COMPLETENESS_PHASE_STEP_ONE_DESCRIPTION.testId)).toHaveTextContent(
      COMPLETENESS_PHASE_STEP_ONE_DESCRIPTION.text
    );
    expect(screen.getByTestId(COMPLETENESS_UPLOAD_BUTTON_NAME)).toBeInTheDocument();
  });

  it("renders uploaded documents", () => {
    setup([mockCompletenessDoc, mockInternalDoc]);
    expect(screen.getByText("Completeness Letter")).toBeInTheDocument();
    expect(screen.getByText("Internal Form")).toBeInTheDocument();
  });

  it("calls showCompletenessDocumentUploadDialog with applicationId when upload button is clicked", async () => {
    setup();
    await userEvent.click(screen.getByTestId(COMPLETENESS_UPLOAD_BUTTON_NAME));
    expect(mockShowCompletenessDocumentUploadDialog).toHaveBeenCalledWith("app-123");
  });

  it("reflects updated documents when props change", () => {
    const { rerender } = render(
      <TestProvider>
        <UploadSection applicationId="app-123" completenessDocuments={[]} />
      </TestProvider>
    );
    expect(screen.queryByText("Completeness Letter")).not.toBeInTheDocument();

    rerender(
      <TestProvider>
        <UploadSection applicationId="app-123" completenessDocuments={[mockCompletenessDoc]} />
      </TestProvider>
    );
    expect(screen.getByText("Completeness Letter")).toBeInTheDocument();
  });

  it("reflects document removal when props change", () => {
    const { rerender } = render(
      <TestProvider>
        <UploadSection
          applicationId="app-123"
          completenessDocuments={[mockCompletenessDoc, mockInternalDoc]}
        />
      </TestProvider>
    );
    expect(screen.getByText("Completeness Letter")).toBeInTheDocument();
    expect(screen.getByText("Internal Form")).toBeInTheDocument();

    rerender(
      <TestProvider>
        <UploadSection applicationId="app-123" completenessDocuments={[]} />
      </TestProvider>
    );
    expect(screen.queryByText("Completeness Letter")).not.toBeInTheDocument();
    expect(screen.queryByText("Internal Form")).not.toBeInTheDocument();
  });
});
