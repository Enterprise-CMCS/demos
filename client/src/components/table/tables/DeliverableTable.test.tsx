import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeliverableTable, formatDeliverableStatus } from "./DeliverableTable";
import { MOCK_DELIVERABLES } from "mock-data/deliverableMocks";
import { sortDeliverablesByDefault } from "util/sortDeliverables";

const sortedDeliverables = sortDeliverablesByDefault(MOCK_DELIVERABLES);
const sortedFirstPageIds = sortedDeliverables.slice(0, 10).map((deliverable) => deliverable.id);

describe("DeliverableTable", () => {
  beforeEach(async () => {
    render(<DeliverableTable deliverables={MOCK_DELIVERABLES} viewMode="demos-cms-user" />);
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  it("renders all deliverable names initially", () => {
    sortedDeliverables.slice(0, 10).forEach((deliverable) => {
      expect(
        screen.getByText(deliverable.name)
      ).toBeInTheDocument();
    });
  });

  it("applies default deliverable ordering on first render", () => {
    const renderedRowIds = screen
      .getAllByTestId(/^select-row-/)
      .map((checkbox) => checkbox.getAttribute("data-testid")?.replace("select-row-", ""));

    expect(renderedRowIds).toEqual(sortedFirstPageIds);
  });

  it("shows empty state when no deliverables provided", async () => {
    render(<DeliverableTable deliverables={[]} viewMode="demos-cms-user" />);

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
        viewMode="demos-cms-user"
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
      screen.getByTestId(`select-row-${sortedFirstPageIds[0]}`)
    );

    const editBtn = screen.getByTestId("edit-deliverable");
    expect(editBtn).not.toBeDisabled();
  });

  it("disables Edit when multiple rows selected", async () => {
    const user = userEvent.setup();

    await user.click(
      screen.getByTestId(`select-row-${sortedFirstPageIds[0]}`)
    );
    await user.click(
      screen.getByTestId(`select-row-${sortedFirstPageIds[1]}`)
    );

    const editBtn = screen.getByTestId("edit-deliverable");
    expect(editBtn).toBeDisabled();
  });

  it("enables Remove when at least one row selected", async () => {
    const user = userEvent.setup();

    await user.click(
      screen.getByTestId(`select-row-${sortedFirstPageIds[0]}`)
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

      await user.type(searchInput, MOCK_DELIVERABLES[0].name);

      await waitFor(() => {
        expect(
          screen.getByText(MOCK_DELIVERABLES[0].name)
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

      await user.type(searchInput, MOCK_DELIVERABLES[0].name);

      await waitFor(() => {
        expect(
          screen.getByText(MOCK_DELIVERABLES[0].name)
        ).toBeInTheDocument();
      });

      const clearBtn = screen.getByRole("button", { name: /clear search/i });
      await user.click(clearBtn);

      expect(searchInput).toHaveValue("");

      sortedDeliverables.slice(0, 10).forEach((deliverable) => {
        expect(
          screen.getByText(deliverable.name)
        ).toBeInTheDocument();
      });
    });
  });

  it("renders status values as-is", () => {
    expect(
      formatDeliverableStatus({
        status: "Upcoming",
      })
    ).toBe("Upcoming");
    expect(
      formatDeliverableStatus({
        status: "Approved",
      })
    ).toBe("Approved");
  });

  it("renders column filter dropdown", () => {
    expect(screen.getByTestId("filter-by-column")).toBeInTheDocument();
  });

  it("renders pagination controls", () => {
    expect(screen.getByText(/Items per page/i)).toBeInTheDocument();
  });
});

describe("DeliverableTable demos-state-user view mode", () => {
  it("renders the state-user column set and hides state/CMS owner", async () => {
    render(<DeliverableTable deliverables={MOCK_DELIVERABLES} viewMode="demos-state-user" />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: /Demonstration Name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Deliverable Type/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Deliverable Name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Due Date/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Status/i })).toBeInTheDocument();

    expect(screen.queryByRole("columnheader", { name: /State\/Territory/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /CMS Owner/i })).not.toBeInTheDocument();
  });

  it("hides row action buttons in state-user mode", () => {
    render(<DeliverableTable deliverables={MOCK_DELIVERABLES} viewMode="demos-state-user" />);

    expect(screen.queryByLabelText(/Add Deliverable/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Edit Deliverable/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Remove Deliverable/i)).not.toBeInTheDocument();
  });
});
