import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TestProvider } from "test-utils/TestProvider";

import {
  CMS_FILES_ADD_BUTTON_NAME,
  CMS_FILES_DELETE_BUTTON_NAME,
  CMS_FILES_EDIT_BUTTON_NAME,
  CmsFilesTab,
} from "./CmsFilesTab";
import type { DeliverableFileRow } from "./DeliverableFileTypes";

const MOCK_FILES: DeliverableFileRow[] = [
  {
    id: "cms-a",
    name: "CmsAlpha.pdf",
    description: "CMS Alpha description",
    documentType: "General File",
    createdAt: new Date("2026-03-10"),
    owner: { person: { fullName: "Tess Davenport" } },
  },
];

const renderTab = (overrides: Partial<React.ComponentProps<typeof CmsFilesTab>> = {}) =>
  render(
    <TestProvider>
      <CmsFilesTab files={MOCK_FILES} {...overrides} />
    </TestProvider>
  );

describe("CmsFilesTab", () => {
  it("renders one row per CMS file", () => {
    renderTab();

    expect(screen.getByText("CmsAlpha.pdf")).toBeInTheDocument();
    expect(screen.getByText("Tess Davenport")).toBeInTheDocument();
  });

  it("renders a View button per file", () => {
    renderTab();

    expect(screen.getByTestId("view-file-cms-a")).toBeInTheDocument();
  });

  it("invokes onAdd when the header Add File(s) button is clicked", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderTab({ onAdd });

    await user.click(screen.getByTestId(CMS_FILES_ADD_BUTTON_NAME));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("renders the empty-rows message when there are no files", () => {
    render(
      <TestProvider>
        <CmsFilesTab files={[]} />
      </TestProvider>
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText(/No files have been added yet\./i)).toBeInTheDocument();
  });

  it("disables Edit until exactly one file is selected", async () => {
    const user = userEvent.setup();
    renderTab();

    const editButton = screen.getByTestId(CMS_FILES_EDIT_BUTTON_NAME);
    expect(editButton).toBeDisabled();

    await user.click(screen.getByTestId("select-row-cms-a"));
    expect(editButton).not.toBeDisabled();
  });

  it("invokes onEdit with the selected file", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderTab({ onEdit });

    await user.click(screen.getByTestId("select-row-cms-a"));
    await user.click(screen.getByTestId(CMS_FILES_EDIT_BUTTON_NAME));

    expect(onEdit).toHaveBeenCalledWith(MOCK_FILES[0]);
  });

  it("disables Delete until at least one file is selected", async () => {
    const user = userEvent.setup();
    renderTab();

    const deleteButton = screen.getByTestId(CMS_FILES_DELETE_BUTTON_NAME);
    expect(deleteButton).toBeDisabled();

    await user.click(screen.getByTestId("select-row-cms-a"));
    expect(deleteButton).not.toBeDisabled();
  });

  it("invokes onDelete with the selected file ids", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderTab({ onDelete });

    await user.click(screen.getByTestId("select-row-cms-a"));
    await user.click(screen.getByTestId(CMS_FILES_DELETE_BUTTON_NAME));

    expect(onDelete).toHaveBeenCalledWith(["cms-a"]);
  });

  it("opens a new tab via View button", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderTab();

    await user.click(screen.getByTestId("view-file-cms-a"));

    expect(openSpy).toHaveBeenCalledWith("/document/cms-a", "_blank");
    openSpy.mockRestore();
  });
});
