import "@testing-library/jest-dom";

import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { AddDocumentModal } from "./DocumentModal";

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

    const longName = "this_is_a_very_long_file_name_that_should_be_truncated_in_the_button_display_but_visible_on_hover.pdf";
    const file = new File(["content"], longName, { type: "application/pdf" });

    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [file] },
    });

    // Wait for the rendered span to appear with title
    const titleSpan = await screen.findByTitle(longName);

    expect(titleSpan.textContent).toContain("...");
  });

});
