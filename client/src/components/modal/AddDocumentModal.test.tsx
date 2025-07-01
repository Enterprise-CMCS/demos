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

import { AddDocumentModal } from "./AddDocumentModal";

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
});
