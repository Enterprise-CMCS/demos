import "@testing-library/jest-dom";

import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AddDocumentModal, RemoveDocumentModal, EditDocumentModal } from "./DocumentModal";

describe("AddDocumentModal", () => {
  const setup = () => {
    const onClose = vi.fn();
    render(
      <ToastProvider>
        <AddDocumentModal onClose={onClose} />
      </ToastProvider>
    );
    return { onClose };
  };

  it("renders modal with title and required fields", () => {
    setup();
    expect(screen.getByText("Add New Document")).toBeInTheDocument();
    expect(screen.getByText("Document Description")).toBeInTheDocument();
    expect(screen.getByText("Select File(s)")).toBeInTheDocument();
  });

  it("shows cancel confirmation modal when cancel is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("Cancel"));
    expect(
      screen.getByText("Are you sure you want to cancel?")
    ).toBeInTheDocument();
  });

  it("disables Upload button when description is missing", () => {
    setup();
    const uploadBtn = screen.getByText("Upload") as HTMLButtonElement;
    expect(uploadBtn.disabled).toBe(true);
  });

  it("enables Upload button when description and file are set", async () => {
    setup();

    const file = new File(["sample"], "test.pdf", { type: "application/pdf" });
    const fileInput = screen.getByTestId("file-input");
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.change(screen.getByPlaceholderText("Enter"), {
      target: { value: "Test document" },
    });

    const uploadBtn = screen.getByText("Upload") as HTMLButtonElement;

    await waitFor(() => {
      expect(uploadBtn.disabled).toBe(false);
    });
  });

  it("calls onClose when confirming cancel", async () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("Yes"));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("renders and allows selecting a document type", async () => {
    setup();
    const input = screen.getByRole("textbox", { name: "Document Type" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "General" } });

    const option = await screen.findByText("General File");
    fireEvent.mouseDown(option);

    expect(input).toHaveValue("General File");
  });

  it("shows upload progress bar after file load", async () => {
    setup();
    const file = new File(["sample"], "test.pdf", { type: "application/pdf" });

    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
    });
  });

  it("truncates and displays file name with title after upload", async () => {
    setup();

    const longName =
      "this_is_a_very_long_file_name_that_should_be_truncated_in_the_button_display_but_visible_on_hover.pdf";
    const file = new File(["content"], longName, { type: "application/pdf" });

    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [file] },
    });

    // Wait for the rendered span to appear with title
    const titleSpan = await screen.findByTitle(longName);

    expect(titleSpan.textContent).toContain("...");
  });
});

describe("RemoveDocumentModal", () => {
  const setup = (ids: string[] = ["1"], onClose = vi.fn()) => {
    render(
      <ToastProvider>
        <RemoveDocumentModal documentIds={ids} onClose={onClose} />
      </ToastProvider>
    );
    return { onClose };
  };

  it("renders with single document", () => {
    setup(["1"]);
    expect(screen.getByText(/Remove Document/)).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to remove 1 document/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This action cannot be undone/)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/ })).toBeInTheDocument();
  });

  it("renders with multiple documents", () => {
    setup(["1", "2", "3"]);
    expect(
      screen.getByText(/Are you sure you want to remove 3 documents/)
    ).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const { onClose } = setup(["1"]);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/ }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows warning and closes when Remove is clicked", () => {
    const { onClose } = setup(["1", "2"]);
    fireEvent.click(screen.getByRole("button", { name: /Remove/ }));
    expect(onClose).toHaveBeenCalled();
    // The warning toast is shown via useToast, which would be tested in integration
  });
});

describe("EditDocumentModal", () => {
  const setup = () => {
    const onClose = vi.fn();
    render(
      <ToastProvider>
        <EditDocumentModal
          documentId="123"
          documentTitle="Existing Document"
          description="This is an existing document"
          documentType="General File"
          onClose={onClose}
        />
      </ToastProvider>
    );
    return { onClose };
  };

  it("renders modal with correct title and fields", () => {
    setup();

    expect(screen.getByText("Edit Document")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Existing Document")
    ).toBeInTheDocument(); // Title
    expect(
      screen.getByDisplayValue("This is an existing document")
    ).toBeInTheDocument(); // Description
    expect(screen.getByDisplayValue("General File")).toBeInTheDocument(); // Document Type
  });

  it("disables Upload button when no file is selected", () => {
    setup();
    const uploadBtn = screen.getByText("Upload") as HTMLButtonElement;
    expect(uploadBtn.disabled).toBe(true);
  });

  it("enables Upload when all fields including file are set", async () => {
    setup();

    const file = new File(["doc"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [file] },
    });

    const uploadBtn = screen.getByText("Upload") as HTMLButtonElement;

    await waitFor(() => {
      expect(uploadBtn.disabled).toBe(false);
    });
  });

  it("calls onClose when cancel is confirmed", async () => {
    const { onClose } = setup();

    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("Yes"));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
