import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TestProvider } from "test-utils/TestProvider";

import type { DeliverableFileRow } from "./DeliverableFileTypes";
import {
  STATE_FILES_ADD_BUTTON_NAME,
  STATE_FILES_DELETE_BUTTON_NAME,
  STATE_FILES_EDIT_BUTTON_NAME,
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
    deliverableSubmissionAction: null,
  },
  {
    id: "file-b",
    name: "Bravo.pdf",
    description: "Bravo description",
    documentType: "Monitoring Report",
    createdAt: new Date("2026-02-20"),
    owner: { person: { fullName: "Bravo Owner" } },
    deliverableSubmissionAction: null,
  },
  {
    id: "file-c",
    name: "Charlie.pdf",
    description: "Charlie description",
    documentType: "General File",
    createdAt: new Date("2026-03-25"),
    owner: { person: { fullName: "Charlie Owner" } },
    deliverableSubmissionAction: {
      actionTimestamp: new Date("2026-06-25"),
    },
  },
];

const renderTab = (overrides: Partial<React.ComponentProps<typeof StateFilesTab>> = {}) => {
  const baseRenderTabProps = {
    files: MOCK_FILES,
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    canManage: true,
    isFinalized: false,
  };
  render(
    <TestProvider>
      <StateFilesTab {...baseRenderTabProps} {...overrides} />
    </TestProvider>
  );
};

describe("StateFilesTab", () => {
  describe("empty state", () => {
    it("renders the table header and shows the empty-rows message", () => {
      renderTab({ files: [] });

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText(/No files have been added yet\./i)).toBeInTheDocument();
    });

    it("renders the header Add File(s) button", () => {
      renderTab({ files: [] });

      expect(screen.getByTestId(STATE_FILES_ADD_BUTTON_NAME)).toBeInTheDocument();
    });

    it("invokes onAdd when the header Add File(s) button is clicked", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      renderTab({ files: [], onAdd });

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

    it("renders the expected columns", () => {
      renderTab();

      expect(screen.getByRole("columnheader", { name: /Type/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /File Name/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Description/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Uploaded By/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Uploaded Date/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Submitted Date/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /View/i })).toBeInTheDocument();
    });

    it("renders the expected data in each row", () => {
      renderTab();

      const row = screen.getByText("Charlie.pdf").closest("tr");
      expect(row).not.toBeNull();

      const cells = within(row as HTMLTableRowElement).getAllByRole("cell");
      expect(within(cells[0]).getByTestId("select-row-file-c")).toBeInTheDocument();
      expect(cells[1]).toHaveTextContent("General File");
      expect(cells[2]).toHaveTextContent("Charlie.pdf");
      expect(cells[3]).toHaveTextContent("Charlie description");
      expect(cells[4]).toHaveTextContent("Charlie Owner");
      expect(cells[5]).toHaveTextContent("03/25/2026");
      expect(cells[6]).toHaveTextContent("06/25/2026");
      expect(within(cells[7]).getByTestId("view-file-file-c")).toBeInTheDocument();
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

      expect(onEdit).toHaveBeenCalledWith(MOCK_FILES[0], expect.any(Function));
    });

    it("deselects rows after Edit dialog is submitted", async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      renderTab({ onEdit });

      await user.click(screen.getByTestId("select-row-file-a"));
      expect(screen.getByTestId("select-row-file-a")).toBeChecked();
      await user.click(screen.getByTestId(STATE_FILES_EDIT_BUTTON_NAME));

      const closeDialogCallback = onEdit.mock.lastCall?.[1];
      closeDialogCallback();

      await waitFor(() => expect(screen.getByTestId("select-row-file-a")).not.toBeChecked());
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

    it("renders a View button per file", () => {
      renderTab();

      expect(screen.getByTestId("view-file-file-a")).toBeInTheDocument();
      expect(screen.getByTestId("view-file-file-b")).toBeInTheDocument();
    });

    it("opens a new tab via View button", async () => {
      const user = userEvent.setup();
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      renderTab();

      await user.click(screen.getByTestId("view-file-file-a"));

      expect(openSpy).toHaveBeenCalledWith("/document/file-a", "_blank");
      openSpy.mockRestore();
    });
  });

  describe("when finalized", () => {
    it("disables the Add File(s) button", () => {
      renderTab({ isFinalized: true });

      const addButton = screen.getByTestId(STATE_FILES_ADD_BUTTON_NAME);
      expect(addButton).toBeDisabled();
      expect(addButton).toHaveAttribute(
        "title",
        "Files cannot be added to a Finalized deliverable."
      );
    });

    it("keeps Edit disabled even when a row is selected", async () => {
      const user = userEvent.setup();
      renderTab({ isFinalized: true });

      const editButton = screen.getByTestId(STATE_FILES_EDIT_BUTTON_NAME);
      expect(editButton).toBeDisabled();

      await user.click(screen.getByTestId("select-row-file-a"));

      expect(editButton).toBeDisabled();
      expect(editButton).toHaveAttribute(
        "title",
        "Documents on Finalized deliverables cannot be edited."
      );
    });
  });
  describe("when file is part of a deliverable submission", () => {
    it("disables Delete for files that are part of a submission", async () => {
      const user = userEvent.setup();
      renderTab();

      await user.click(screen.getByTestId("select-row-file-c"));

      expect(screen.getByTestId(STATE_FILES_DELETE_BUTTON_NAME)).toBeDisabled();
    });

    it("allows Delete for files that are not part of a submission", async () => {
      const user = userEvent.setup();
      renderTab();

      await user.click(screen.getByTestId("select-row-file-a"));

      expect(screen.getByTestId(STATE_FILES_DELETE_BUTTON_NAME)).not.toBeDisabled();
    });
  });
});
