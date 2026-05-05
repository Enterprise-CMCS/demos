import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TestProvider } from "test-utils/TestProvider";

import type { DeliverableFileRow } from "./DeliverableFileTypes";
import {
  STATE_FILES_ADD_BUTTON_NAME,
  STATE_FILES_DELETE_BUTTON_NAME,
  STATE_FILES_EDIT_BUTTON_NAME,
  STATE_FILES_SUBMIT_BUTTON_NAME,
  StateFilesTab,
} from "./StateFilesTab";

const MOCK_FILES: DeliverableFileRow[] = [
  {
    id: "file-a",
    name: "Alpha.pdf",
    description: "Alpha description",
    documentType: "General File",
    createdAt: new Date("2026-01-15"),
    owner: { person: { fullName: "Alpha Owner" } },
  },
  {
    id: "file-b",
    name: "Bravo.pdf",
    description: "Bravo description",
    documentType: "Monitoring Report",
    createdAt: new Date("2026-02-20"),
    owner: { person: { fullName: "Bravo Owner" } },
  },
];

const renderTab = (overrides: Partial<React.ComponentProps<typeof StateFilesTab>> = {}) =>
  render(
    <TestProvider>
      <StateFilesTab files={MOCK_FILES} {...overrides} />
    </TestProvider>
  );

describe("StateFilesTab", () => {
  describe("empty state", () => {
    const renderEmpty = (overrides: Partial<React.ComponentProps<typeof StateFilesTab>> = {}) =>
      render(
        <TestProvider>
          <StateFilesTab files={[]} {...overrides} />
        </TestProvider>
      );

    it("renders the table header and shows the empty-rows message", () => {
      renderEmpty();

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText(/No files have been added yet\./i)).toBeInTheDocument();
    });

    it("renders the header Add File(s) button", () => {
      renderEmpty();

      expect(screen.getByTestId(STATE_FILES_ADD_BUTTON_NAME)).toBeInTheDocument();
    });

    it("hides the Submit Deliverable button", () => {
      renderEmpty();

      expect(screen.queryByTestId(STATE_FILES_SUBMIT_BUTTON_NAME)).not.toBeInTheDocument();
    });

    it("invokes onAdd when the header Add File(s) button is clicked", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      renderEmpty({ onAdd });

      await user.click(screen.getByTestId(STATE_FILES_ADD_BUTTON_NAME));

      expect(onAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe("populated state", () => {
    it("renders a row per file", () => {
      renderTab();

      expect(screen.getByText("Alpha.pdf")).toBeInTheDocument();
      expect(screen.getByText("Bravo.pdf")).toBeInTheDocument();
    });

    it("disables Edit until exactly one file is selected", async () => {
      const user = userEvent.setup();
      renderTab();

      const editButton = screen.getByTestId(STATE_FILES_EDIT_BUTTON_NAME);
      expect(editButton).toBeDisabled();

      await user.click(screen.getByTestId("select-row-file-a"));
      expect(editButton).not.toBeDisabled();

      await user.click(screen.getByTestId("select-row-file-b"));
      expect(editButton).toBeDisabled();
    });

    it("disables Delete until at least one file is selected", async () => {
      const user = userEvent.setup();
      renderTab();

      const deleteButton = screen.getByTestId(STATE_FILES_DELETE_BUTTON_NAME);
      expect(deleteButton).toBeDisabled();

      await user.click(screen.getByTestId("select-row-file-a"));
      expect(deleteButton).not.toBeDisabled();
    });

    it("invokes onEdit with the selected file", async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      renderTab({ onEdit });

      await user.click(screen.getByTestId("select-row-file-a"));
      await user.click(screen.getByTestId(STATE_FILES_EDIT_BUTTON_NAME));

      expect(onEdit).toHaveBeenCalledWith(MOCK_FILES[0]);
    });

    it("invokes onDelete with all selected file ids", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      renderTab({ onDelete });

      await user.click(screen.getByTestId("select-row-file-a"));
      await user.click(screen.getByTestId("select-row-file-b"));
      await user.click(screen.getByTestId(STATE_FILES_DELETE_BUTTON_NAME));

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete.mock.calls[0][0]).toHaveLength(2);
      expect(onDelete.mock.calls[0][0]).toEqual(expect.arrayContaining(["file-a", "file-b"]));
    });

    it("invokes onAdd when the header Add File(s) button is clicked", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      renderTab({ onAdd });

      await user.click(screen.getByTestId(STATE_FILES_ADD_BUTTON_NAME));

      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it("shows Submit Deliverable only when files are present", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      renderTab({ onSubmit });

      const submitButton = screen.getByTestId(STATE_FILES_SUBMIT_BUTTON_NAME);
      expect(submitButton).toBeInTheDocument();

      await user.click(submitButton);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
