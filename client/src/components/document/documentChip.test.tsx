import "@testing-library/jest-dom";

import React from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DocumentChip } from "./documentChip";

describe("DocumentChip", () => {
  const baseDocument = {
    name: "State Application.pdf",
    documentType: "State Application" as const,
    createdAt: new Date("2024-01-15T10:00:00Z"),
  };

  it("renders a preview link when the document has an id", () => {
    render(<DocumentChip document={{ ...baseDocument, id: "doc-1" }} onRemove={vi.fn()} />);

    const link = screen.getByRole("link", { name: /state application\.pdf/i });

    expect(link).toHaveAttribute("href", "/document/doc-1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders non-link content when the document has no id", () => {
    render(<DocumentChip document={baseDocument} onRemove={vi.fn()} />);

    expect(screen.queryByRole("link", { name: /state application\.pdf/i })).not.toBeInTheDocument();
    expect(screen.getByText("State Application.pdf")).toBeInTheDocument();
  });

  it("renders metadata when createdAt and documentType are present", () => {
    render(<DocumentChip document={baseDocument} onRemove={vi.fn()} />);

    expect(screen.getByText(/01\/15\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/• State Application/)).toBeInTheDocument();
  });

  it("omits metadata when createdAt or documentType is missing", () => {
    render(
      <DocumentChip
        document={{
          name: "Pending Upload.pdf",
        }}
        onRemove={vi.fn()}
      />
    );

    expect(screen.queryByText(/--\/--\/----/)).not.toBeInTheDocument();
    expect(screen.queryByText(/pending upload •/i)).not.toBeInTheDocument();
  });

  it("calls onRemove when the delete button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(<DocumentChip document={baseDocument} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Delete State Application.pdf" }));

    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("truncates long names in the UI while preserving the full name in the title", () => {
    const longName =
      "this-is-a-very-long-document-name-that-should-be-shortened-for-display-only.pdf";

    render(
      <DocumentChip
        document={{
          ...baseDocument,
          name: longName,
        }}
        onRemove={vi.fn()}
      />
    );

    const titleElement = screen.getByTitle(longName);

    expect(titleElement).toBeInTheDocument();
    expect(titleElement).not.toHaveTextContent(longName);
    expect(titleElement).toHaveTextContent("...");
  });
});
