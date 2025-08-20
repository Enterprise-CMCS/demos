import "@testing-library/jest-dom";

import React from "react";
import { ToastProvider } from "components/toast/ToastContext";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RemoveDocumentModal, AddDocumentModal, EditDocumentModal } from "./DocumentModal";

let mockDelete: () => Promise<{ data: { removedDocumentIds: string[] } }>;

beforeEach(() => {
  mockDelete = vi.fn().mockResolvedValue({ data: { removedDocumentIds: ["1"] } });
  vi.mock("@apollo/client", async () => {
    const actual = await vi.importActual("@apollo/client");
    return {
      ...actual,
      useMutation: () => [mockDelete],
    };
  });
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

const CONFIRM_REMOVE_BUTTON_TEST_ID = "confirm-remove";
const CANCEL_REMOVE_BUTTON_TEST_ID = "cancel-remove";
const UPLOAD_DOCUMENT_BUTTON_TEST_ID = "upload-document";

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
    expect(screen.getByText("Are you sure you want to cancel?")).toBeInTheDocument();
  });

  it("has disabled button in edit when file is missing", () => {
    setup();
    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    expect(uploadBtn).toBeDisabled(); // pulls from the native disabled prop
  });

  it("enables Upload button when description, type, and file are set", async () => {
    setup();

    // file
    const file = new File(["sample"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [file] },
    });

    // description
    fireEvent.change(screen.getByPlaceholderText("Enter"), {
      target: { value: "Test document" },
    });

    // type (AutoCompleteSelect)
    const typeInput = screen.getByRole("textbox", { name: "Document Type" });
    fireEvent.focus(typeInput);
    fireEvent.change(typeInput, { target: { value: "General" } });
    const option = await screen.findByText("General File");
    fireEvent.mouseDown(option);

    // assert using the actual button node
    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    await waitFor(() => expect(uploadBtn).toBeEnabled());
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
    expect(screen.getByText(/Are you sure you want to remove 1 document/)).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    expect(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(CANCEL_REMOVE_BUTTON_TEST_ID)).toBeInTheDocument();
  });

  it("renders with multiple documents", () => {
    setup(["1", "2", "3"]);
    expect(screen.getByText(/Are you sure you want to remove 3 documents/)).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const { onClose } = setup(["1"]);
    fireEvent.click(screen.getByTestId(CANCEL_REMOVE_BUTTON_TEST_ID));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows warning and closes when Remove is clicked", async () => {
    const { onClose } = setup(["1", "2"]);
    await act(async () => {
      fireEvent.click(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID));
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("calls deleteDocumentsTrigger when Remove is clicked", async () => {
    setup(["test-document-id"]);
    fireEvent.click(screen.getByRole("button", { name: /Remove/ }));
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith({ variables: { ids: ["test-document-id"] } });
    });
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
    expect(screen.getByDisplayValue("Existing Document")).toBeInTheDocument(); // Title
    expect(screen.getByDisplayValue("This is an existing document")).toBeInTheDocument(); // Description
    expect(screen.getByDisplayValue("General File")).toBeInTheDocument(); // Document Type
  });

  it("disables Upload button when no file is selected", () => {
    setup();
    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    expect(uploadBtn).toBeDisabled();
  });

  it("enables Upload button when description, type, and file are set", async () => {
    setup();

    // file
    const file = new File(["sample"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [file] },
    });

    // description
    fireEvent.change(screen.getByPlaceholderText("Enter"), {
      target: { value: "Test document" },
    });

    // document type (your component requires it)
    const typeInput = screen.getByRole("textbox", { name: "Document Type" });
    fireEvent.focus(typeInput);
    fireEvent.change(typeInput, { target: { value: "General" } });
    const option = await screen.findByText("General File");
    fireEvent.mouseDown(option);

    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    await waitFor(() => expect(uploadBtn).toBeEnabled());
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
