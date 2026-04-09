import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeliverableTable } from "./DeliverableTable";
import { MOCK_DELIVERABLES } from "mock-data/deliverableMocks";

describe("DeliverableTable", () => {
  beforeEach(async () => {
    render(<DeliverableTable deliverables={MOCK_DELIVERABLES} viewMode="cmsUser" />);
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  it("renders all deliverable names initially", () => {
    MOCK_DELIVERABLES.slice(0, 10).forEach((deliverable) => {
      expect(
        screen.getByText(deliverable.deliverableName)
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no deliverables provided", async () => {
    render(<DeliverableTable deliverables={[]} viewMode="cmsUser" />);

    await waitFor(() => {
      expect(
        screen.getByText("There are no assigned Deliverables at this time")
      ).toBeInTheDocument();
    });
  });

  it("supports custom empty state message", async () => {
    render(
      <DeliverableTable
        deliverables={[]}
        emptyRowsMessage="You have no assigned Deliverables at this time"
        viewMode="cmsUser"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("You have no assigned Deliverables at this time")
      ).toBeInTheDocument();
    });
  });

  it("renders action buttons (add/edit/remove)", () => {
    expect(screen.getByLabelText(/Add Deliverable/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Edit Deliverable/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Remove Deliverable/i)).toBeInTheDocument();
  });

  it("disables Edit and Remove when nothing selected", () => {
    const editBtn = screen.getByTestId("edit-deliverable");
    const removeBtn = screen.getByTestId("remove-deliverable");

    expect(editBtn).toBeDisabled();
    expect(removeBtn).toBeDisabled();
  });

  it("enables Edit for exactly one selected row", async () => {
    const user = userEvent.setup();

    await user.click(
      screen.getByTestId(`select-row-${MOCK_DELIVERABLES[0].id}`)
    );

    const editBtn = screen.getByTestId("edit-deliverable");
    expect(editBtn).not.toBeDisabled();
  });

  it("disables Edit when multiple rows selected", async () => {
    const user = userEvent.setup();

    await user.click(
      screen.getByTestId(`select-row-${MOCK_DELIVERABLES[0].id}`)
    );
    await user.click(
      screen.getByTestId(`select-row-${MOCK_DELIVERABLES[1].id}`)
    );

    const editBtn = screen.getByTestId("edit-deliverable");
    expect(editBtn).toBeDisabled();
  });

  it("enables Remove when at least one row selected", async () => {
    const user = userEvent.setup();

    await user.click(
      screen.getByTestId(`select-row-${MOCK_DELIVERABLES[0].id}`)
    );

    const removeBtn = screen.getByTestId("remove-deliverable");
    expect(removeBtn).not.toBeDisabled();
  });

  describe("Keyword Search functionality", () => {
    it("renders search input", () => {
      const searchInput = screen.getByLabelText(/search:/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("filters deliverables by keyword", async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByLabelText(/search:/i);

      await user.type(searchInput, MOCK_DELIVERABLES[0].deliverableName);

      await waitFor(() => {
        expect(
          screen.getByText(MOCK_DELIVERABLES[0].deliverableName)
        ).toBeInTheDocument();
      });
    });

    it("shows no results message if nothing matches", async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByLabelText(/search:/i);

      await user.type(searchInput, "notarealkeyword");

      await waitFor(() => {
        expect(
          screen.getByText(
            /No results were returned. Adjust your search and filter criteria./i
          )
        ).toBeInTheDocument();
      });
    });

    it("clears search and restores rows", async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByLabelText(/search:/i);

      await user.type(searchInput, MOCK_DELIVERABLES[0].deliverableName);

      await waitFor(() => {
        expect(
          screen.getByText(MOCK_DELIVERABLES[0].deliverableName)
        ).toBeInTheDocument();
      });

      const clearBtn = screen.getByRole("button", { name: /clear search/i });
      await user.click(clearBtn);

      expect(searchInput).toHaveValue("");

      MOCK_DELIVERABLES.slice(0, 10).forEach((deliverable) => {
        expect(
          screen.getByText(deliverable.deliverableName)
        ).toBeInTheDocument();
      });
    });
  });

  it("renders combined status values for upcoming deliverables", () => {
    expect(screen.getAllByText("Upcoming").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Upcoming - Extension Requested").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Upcoming (2) - Extension Requested").length).toBeGreaterThan(0);
  });

  it("renders column filter dropdown", () => {
    expect(screen.getByTestId("filter-by-column")).toBeInTheDocument();
  });

  it("renders pagination controls", () => {
    expect(screen.getByText(/Items per page/i)).toBeInTheDocument();
  });
});

describe("DeliverableTable stateUser view mode", () => {
  it("renders the state-user column set and hides state/CMS owner", async () => {
    render(<DeliverableTable deliverables={MOCK_DELIVERABLES} viewMode="stateUser" />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: /Demonstration Name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Deliverable Type/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Deliverable Name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Due Date/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Submission Date/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Status/i })).toBeInTheDocument();

    expect(screen.queryByRole("columnheader", { name: /State\/Territory/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /CMS Owner/i })).not.toBeInTheDocument();
  });

  it("hides row action buttons in state-user mode", () => {
    render(<DeliverableTable deliverables={MOCK_DELIVERABLES} viewMode="stateUser" />);

    expect(screen.queryByLabelText(/Add Deliverable/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Edit Deliverable/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Remove Deliverable/i)).not.toBeInTheDocument();
  });
});
