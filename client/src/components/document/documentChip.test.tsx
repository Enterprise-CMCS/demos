import "@testing-library/jest-dom";

import React from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";

import { DocumentChip } from "./documentChip";
import { DialogProvider } from "components/dialog/DialogContext";

describe("DocumentChip", () => {
  const baseDocument = {
    id: "doc-1",
    name: "State Application.pdf",
    documentType: "State Application" as const,
    createdAt: new Date("2024-01-15T10:00:00Z"),
  };

  const setup = (document = baseDocument, onRemove?: () => void) =>
    render(
      <TestProvider>
        <DialogProvider>
          <DocumentChip document={document} onRemove={onRemove} />
        </DialogProvider>
      </TestProvider>
    );

  it("renders a preview link when the document has an id", () => {
    setup({ ...baseDocument, id: "doc-1" });

    const link = screen.getByRole("link", { name: /state application\.pdf/i });

    expect(link).toHaveAttribute("href", "/document/doc-1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders non-link content when the document has no id", () => {
    setup({ ...baseDocument, id: "" });

    expect(screen.queryByRole("link", { name: /state application\.pdf/i })).not.toBeInTheDocument();
    expect(screen.getByText("State Application.pdf")).toBeInTheDocument();
  });

  it("renders metadata when createdAt and documentType are present", () => {
    setup(baseDocument);

    expect(screen.getByText(/01\/15\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/• State Application/)).toBeInTheDocument();
  });

  it("omits metadata when createdAt or documentType is missing", () => {
    setup({
      ...baseDocument,
      id: "",
      name: "Pending Upload.pdf",
    });

    expect(screen.queryByText(/--\/--\/----/)).not.toBeInTheDocument();
    expect(screen.queryByText(/pending upload •/i)).not.toBeInTheDocument();
  });

  it("calls onRemove when the delete button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    setup(baseDocument, onRemove);

    await user.click(screen.getByRole("button", { name: "Delete State Application.pdf" }));

    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("does not render the delete button when onRemove is not passed", () => {
    setup(baseDocument);

    expect(
      screen.queryByRole("button", { name: "Delete State Application.pdf" })
    ).not.toBeInTheDocument();
  });

  it("truncates long names in the UI while preserving the full name in the title", () => {
    const longName =
      "this-is-a-very-long-document-name-that-should-be-shortened-for-display-only.pdf";

    setup({
      ...baseDocument,
      name: longName,
    });

    const titleElement = screen.getByTitle(longName);

    expect(titleElement).toBeInTheDocument();
    expect(titleElement).not.toHaveTextContent(longName);
    expect(titleElement).toHaveTextContent("...");
  });
});
