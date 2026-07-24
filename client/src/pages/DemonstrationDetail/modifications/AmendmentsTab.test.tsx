import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AmendmentsTab } from "./AmendmentsTab";
import { ModificationTabs } from "./ModificationTabs";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { DEMONSTRATION_AMENDMENTS_QUERY } from "./modificationQueries";

const showCreateAmendmentDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCreateAmendmentDialog,
  }),
}));

vi.mock("./ModificationTabs", () => ({
  ModificationTabs: vi.fn(() => <div data-testid="modification-tabs">Modification Tabs</div>),
}));

const mockAmendments = [
  {
    id: "amendment-1",
    name: "Amendment 1",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
];

describe("AmendmentsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAmendmentsTab = (amendments = mockAmendments, canCreateModifications = true) => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: DEMONSTRATION_AMENDMENTS_QUERY,
          variables: { id: "mock-demonstration-id" },
        },
        result: {
          data: {
            demonstration: {
              id: "mock-demonstration-id",
              amendments,
            },
          },
        },
      },
    ];
    return render(
      <MockedProvider mocks={mocks}>
        <AmendmentsTab
          demonstrationId="mock-demonstration-id"
          medicaidId="mock-medicaid-id"
          selectedAmendmentId="mock-amendment-id"
          canCreateModifications={canCreateModifications}
        />
      </MockedProvider>
    );
  };

  it("shows empty state message when there are no amendments", async () => {
    renderAmendmentsTab([]);

    expect(await screen.findByText("No amendments have been added yet")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Amendments/i })).not.toBeInTheDocument();
    expect(ModificationTabs).not.toHaveBeenCalled();
  });

  it("shows centered create amendment button when there are no amendments", async () => {
    renderAmendmentsTab([]);

    const createButton = await screen.findByRole("button", { name: /create amendment/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveTextContent("Create Amendment");
  });

  it("opens Add New Amendment modal from the empty state", async () => {
    renderAmendmentsTab([]);

    const createButton = await screen.findByRole("button", { name: /create amendment/i });
    await fireEvent.click(createButton);

    expect(showCreateAmendmentDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });

  it("does not open Add New Amendment modal from the empty state when creation is disabled", async () => {
    renderAmendmentsTab([], false);

    const createButton = await screen.findByRole("button", { name: /create amendment/i });
    expect(createButton).toBeDisabled();
    await fireEvent.click(createButton);

    expect(showCreateAmendmentDialog).not.toHaveBeenCalled();
  });

  it("shows amendments tab title when amendments exist", async () => {
    renderAmendmentsTab(mockAmendments);

    expect(await screen.findByRole("heading", { name: /Amendments/i })).toBeInTheDocument();
  });

  it("shows add amendment button when amendments exist", async () => {
    renderAmendmentsTab(mockAmendments);

    const addButton = await screen.findByRole("button", { name: /add-new-amendment/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add Amendment");
  });

  it("opens Add New Amendment modal from the header button", async () => {
    renderAmendmentsTab(mockAmendments);

    const addButton = await screen.findByRole("button", { name: /add-new-amendment/i });
    await fireEvent.click(addButton);

    expect(showCreateAmendmentDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });

  it("does not open Add New Amendment modal from the header button when creation is disabled", async () => {
    renderAmendmentsTab(mockAmendments, false);

    const addButton = await screen.findByRole("button", { name: /add-new-amendment/i });
    expect(addButton).toBeDisabled();
    await fireEvent.click(addButton);

    expect(showCreateAmendmentDialog).not.toHaveBeenCalled();
  });

  it("passes the selected amendment to ModificationTabs when amendments exist", async () => {
    renderAmendmentsTab(mockAmendments);

    await screen.findByTestId("modification-tabs");
    expect(ModificationTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            id: "amendment-1",
            medicaidId: "mock-medicaid-id",
            modificationType: "amendment",
          }),
        ],
        selectedItemId: "mock-amendment-id",
      }),
      undefined
    );

    expect(screen.getByTestId("modification-tabs")).toBeInTheDocument();
  });
});
