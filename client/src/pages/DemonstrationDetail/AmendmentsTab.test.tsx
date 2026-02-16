import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AmendmentsTab } from "./AmendmentsTab";

const showCreateAmendmentDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCreateAmendmentDialog,
  }),
}));

describe("AmendmentsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAmendmentsTab = () => {
    return render(<AmendmentsTab demonstrationId="mock-demonstration-id" />);
  };

  it("shows amendments tab title", async () => {
    renderAmendmentsTab();

    expect(screen.getByRole("heading", { name: /Amendments/i })).toBeInTheDocument();
  });

  it("shows add amendment button", async () => {
    renderAmendmentsTab();

    const addButton = screen.getByRole("button", { name: /add-new-amendment/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add Amendment");
  });

  it("opens Add New Amendment modal", async () => {
    renderAmendmentsTab();

    const addButton = screen.getByRole("button", { name: /add-new-amendment/i });
    await fireEvent.click(addButton);

    expect(showCreateAmendmentDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });
});
