import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AmendmentsTab } from "./AmendmentsTab";
import { AmendmentTable } from "components/table/tables/AmendmentTable";

vi.mock("components/table/tables/AmendmentTable", () => ({
  AmendmentTable: vi.fn(() => <div data-testid="amendment-table">AmendmentTable</div>),
}));

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

  const renderAmendmentsTab = (initiallyExpandedId?: string) => {
    return render(
      <AmendmentsTab
        demonstrationId="mock-demonstration-id"
        initiallyExpandedId={initiallyExpandedId}
      />
    );
  };

  it("shows amendments tab title", async () => {
    renderAmendmentsTab();

    expect(screen.getByRole("heading", { name: /Amendments/i })).toBeInTheDocument();
  });

  it("shows amendments table", async () => {
    renderAmendmentsTab();

    expect(AmendmentTable).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "mock-demonstration-id",
        initiallyExpandedId: undefined,
      }),
      undefined
    );
    expect(screen.getByTestId("amendment-table")).toBeInTheDocument();
  });

  it("passes initiallyExpandedId to AmendmentTable", async () => {
    renderAmendmentsTab("amendment-123");

    expect(AmendmentTable).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "mock-demonstration-id",
        initiallyExpandedId: "amendment-123",
      }),
      undefined
    );
  });

  it("does not pass initiallyExpandedId when undefined", async () => {
    renderAmendmentsTab();

    expect(AmendmentTable).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "mock-demonstration-id",
        initiallyExpandedId: undefined,
      }),
      undefined
    );
  });

  it("shows add amendment button", async () => {
    renderAmendmentsTab();

    const addButton = screen.getByRole("button", { name: /add-new-amendment/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add New");
  });

  it("opens Add New Amendment modal", async () => {
    renderAmendmentsTab();

    const addButton = screen.getByRole("button", { name: /add-new-amendment/i });
    await fireEvent.click(addButton);

    expect(showCreateAmendmentDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });
});
