import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApprovalPackageTable } from "./ApprovalPackageTable";
import { ApplicationWorkflowDocument } from "components/application/ApplicationWorkflow";
import { DocumentType } from "demos-server";

// Mock dialog context
const showApprovalPackageDocumentUploadDialog = vi.fn();
const showEditDocumentDialog = vi.fn();
const showRemoveDocumentDialog = vi.fn();

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showApprovalPackageDocumentUploadDialog,
    showEditDocumentDialog,
    showRemoveDocumentDialog,
  }),
}));

// Helpers
const mockDocument = (
  overrides: Partial<ApplicationWorkflowDocument> = {}
): ApplicationWorkflowDocument => ({
  id: "doc-1",
  name: "Real Doc Name",
  description: "Real Description",
  documentType: "Approval Letter" as DocumentType,
  createdAt: new Date("2025-01-05T00:00:00.000Z"),
  phaseName: "Approval Package",
  owner: { person: { fullName: "John Doe" } },
  ...overrides,
});


describe("ApprovalPackageTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const rows = [
    {
      documentType: "Approval Letter" as DocumentType,
      id: undefined,
      name: "-",
      description: "-",
      uploadedBy: "-",
      uploadedDate: "-",
      document: undefined,
    },
    {
      documentType: "Signed Decision Memo" as DocumentType,
      id: "doc-22",
      name: "Decision Memo",
      description: "Memo desc",
      uploadedBy: "Alice",
      uploadedDate: "Feb 1, 2025",
      document: mockDocument({ id: "doc-22", documentType: "Signed Decision Memo" }),
    },
  ];

  const setup = () =>
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <ApprovalPackageTable demonstrationId="demo-123" rows={rows} />
      </MockedProvider>
    );

  it("renders the table", async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  it("renders upload button for rows without a document", async () => {
    setup();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Upload Approval Letter/i })
      ).toBeInTheDocument();
    });
  });

  it("renders edit + delete buttons for rows with documents", async () => {
    setup();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Edit Signed Decision Memo/i })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Delete Signed Decision Memo/i })
    ).toBeInTheDocument();
  });

  it("opens Upload dialog with correct args", async () => {
    const user = userEvent.setup();
    setup();

    const uploadBtn = await screen.findByRole("button", {
      name: /Upload Approval Letter/i,
    });

    await user.click(uploadBtn);

    expect(showApprovalPackageDocumentUploadDialog).toHaveBeenCalledWith(
      "demo-123",
      "Approval Letter"
    );
  });

  it("opens Edit dialog with complete document payload", async () => {
    const user = userEvent.setup();
    setup();

    const editBtn = await screen.findByRole("button", {
      name: /Edit Signed Decision Memo/i,
    });

    await user.click(editBtn);

    expect(showEditDocumentDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "doc-22",
        name: "Real Doc Name",
        description: "Real Description",
        documentType: "Signed Decision Memo",
        file: null,
      })
    );
  });

  it("opens Delete dialog with correct ID", async () => {
    const user = userEvent.setup();
    setup();

    const deleteBtn = await screen.findByRole("button", {
      name: /Delete Signed Decision Memo/i,
    });

    await user.click(deleteBtn);

    expect(showRemoveDocumentDialog).toHaveBeenCalledWith(["doc-22"]);
  });

  it("does not render Upload button for rows with documents", async () => {
    setup();
    const uploadForSecondRow = screen.queryByRole("button", {
      name: /Upload Signed Decision Memo/i,
    });
    expect(uploadForSecondRow).toBeNull();
  });

  it("does not render Edit/Delete buttons for rows without documents", async () => {
    setup();
    const editMissing = screen.queryByRole("button", {
      name: /Edit Approval Letter/i,
    });
    const deleteMissing = screen.queryByRole("button", {
      name: /Delete Approval Letter/i,
    });
    expect(editMissing).toBeNull();
    expect(deleteMissing).toBeNull();
  });
});
