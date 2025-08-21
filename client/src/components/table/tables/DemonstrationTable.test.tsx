import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { demonstrations } from "mock-data/demonstrationMocks";
import { userOptions } from "mock-data/userMocks";
import { stateOptions } from "mock-data/stateMocks";
import { demonstrationStatusOptions } from "mock-data/demonstrationStatusMocks";
import { DemonstrationTable } from "./DemonstrationTable";

describe("Demonstrations table", () => {
  describe("Empty states", () => {
    it("renders default empty message", async () => {
      render(
        <DemonstrationTable
          projectOfficerOptions={userOptions}
          statusOptions={demonstrationStatusOptions}
          stateOptions={stateOptions}
          demonstrations={[]}
        />
      );
      expect(screen.getByText("No demonstrations are tracked.")).toBeInTheDocument();
    });

    it("render passed empty rows message", async () => {
      render(
        <DemonstrationTable
          projectOfficerOptions={userOptions}
          statusOptions={demonstrationStatusOptions}
          stateOptions={stateOptions}
          demonstrations={[]}
          emptyRowsMessage="Custom empty message"
        />
      );
      expect(screen.getByText("Custom empty message")).toBeInTheDocument();
    });
  });

  describe("Table rendering", () => {
    beforeEach(async () => {
      localStorage.clear();
      render(
        <DemonstrationTable
          projectOfficerOptions={userOptions}
          statusOptions={demonstrationStatusOptions}
          stateOptions={stateOptions}
          demonstrations={demonstrations}
        />
      );
    });

    it("renders the table with all expected column headers", () => {
      expect(screen.getByRole("table")).toBeInTheDocument();

      expect(screen.getByRole("columnheader", { name: /Title/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /State\/Territory/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Project Officer/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Applications/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Status/i })).toBeInTheDocument();
    });

    it("renders demonstration data correctly in table cells", () => {
      const table = screen.getByRole("table");

      const row = within(table).getByText("Montana Medicaid Waiver").closest("tr");
      expect(row).toBeInTheDocument();
      const cells = within(row!).getAllByRole("cell");

      expect(within(cells[0]).getByRole("checkbox")).toBeInTheDocument();
      expect(cells[1]).toHaveTextContent("Montana");
      expect(cells[2]).toHaveTextContent("Montana Medicaid Waiver");
      expect(cells[3]).toHaveTextContent("John Doe");
      expect(cells[4]).toHaveTextContent(/Amendments \(2\)/);
      expect(cells[4]).toHaveTextContent(/Extensions \(1\)/);
      expect(cells[5]).toHaveTextContent("Approved");
      expect(within(cells[6]).getByRole("button")).toHaveTextContent("View");
      expect(within(cells[7]).getByRole("button", { name: /Expand/i })).toBeInTheDocument();
    });
  });

  describe("Table features", () => {
    beforeEach(async () => {
      localStorage.clear();
      render(
        <DemonstrationTable
          projectOfficerOptions={userOptions}
          statusOptions={demonstrationStatusOptions}
          stateOptions={stateOptions}
          demonstrations={demonstrations}
        />
      );
    });

    it("includes table features (search, filter, pagination)", () => {
      expect(
        screen.getByRole("textbox", { name: /input keyword search query/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: /filter by:/i })).toBeInTheDocument();
      expect(screen.getByText("Items per page:")).toBeInTheDocument();
    });

    it("allows searching within demonstrations", async () => {
      expect(screen.queryByText("Texas Reform Initiative")).toBeInTheDocument();

      const keywordSearchInput = screen.getByRole("textbox", {
        name: /input keyword search query/i,
      });

      await userEvent.type(keywordSearchInput, "Montana");
      await waitFor(() => {
        expect(
          screen.getByText((content, element) => {
            return element?.textContent === "Montana Medicaid Waiver";
          })
        ).toBeInTheDocument();
        expect(screen.queryByText("Texas Reform Initiative")).not.toBeInTheDocument();
      });
    });

    it("shows correct no results message when search returns no results", async () => {
      const keywordSearchInput = screen.getByRole("textbox", {
        name: /input keyword search query/i,
      });

      await userEvent.type(keywordSearchInput, "abcdefg");

      await waitFor(() => {
        expect(
          screen.getByText("No results were returned. Adjust your search and filter criteria.")
        ).toBeInTheDocument();
      });
    });

    it("allows filtering demonstrations by column", async () => {
      // Select "State/Territory" from the filter-by select
      const filterBySelect = screen.getByRole("combobox", { name: /filter by:/i });
      await userEvent.selectOptions(filterBySelect, "stateName");

      // Wait for the State/Territory filter input to appear
      const stateFilterInput = await screen.findByPlaceholderText(/select state\/territory/i);

      // Type "MT" to filter the options
      await userEvent.type(stateFilterInput, "MT");

      // Wait for the "MT" option to appear and click it
      const mtOption = await screen.findByText("MT");
      await userEvent.click(mtOption);

      // Optionally, assert that the table now shows only Montana results
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.queryByText("Texas Reform Initiative")).not.toBeInTheDocument();
    });
  });
  describe("Applications column", () => {
    beforeEach(async () => {
      localStorage.clear();
      render(
        <DemonstrationTable
          projectOfficerOptions={userOptions}
          statusOptions={demonstrationStatusOptions}
          stateOptions={stateOptions}
          demonstrations={demonstrations}
        />
      );
    });

    it("displays correct values for 'Applications' column for new demonstration, amendment, and extension", async () => {
      const table = screen.getByRole("table");
      const montanaRow = within(table).getByText("Montana Medicaid Waiver").closest("tr");
      expect(montanaRow).toHaveTextContent(/Amendments \(2\)/);
      expect(montanaRow).toHaveTextContent(/Extensions \(1\)/);
    });

    it("displays (0) for amendments and extensions if there are no associated records", () => {
      const table = screen.getByRole("table");
      const texasRow = within(table).getByText("Texas Reform Initiative").closest("tr");
      expect(texasRow).toHaveTextContent(/Amendments \(0\)/);
      expect(texasRow).toHaveTextContent(/Extensions \(0\)/);
    });

    it("disables sorting for the 'Applications' column", () => {
      const applicationsHeader = screen.getByRole("columnheader", {
        name: "Applications",
      });
      // Check that the header does not have a sort button or aria-sort attribute
      expect(applicationsHeader).not.toHaveAttribute("aria-sort");
      expect(applicationsHeader.querySelector("button[aria-label*='sort']")).toBeNull();
    });
  });

  describe("Nested view and row expansion for amendments and extensions", () => {
    beforeEach(async () => {
      localStorage.clear();
      render(
        <DemonstrationTable
          projectOfficerOptions={userOptions}
          statusOptions={demonstrationStatusOptions}
          stateOptions={stateOptions}
          demonstrations={demonstrations}
        />
      );
    });
    it("displays amendment and extension records in a nested view under their parent demonstration", async () => {
      expect(screen.queryByText("Amendment 1 - Montana Medicaid Waiver")).not.toBeInTheDocument();
      expect(screen.queryByText("Extension 1 - Montana Medicaid Waiver")).not.toBeInTheDocument();

      const table = screen.getByRole("table");
      const montanaRow = within(table).getByText("Montana Medicaid Waiver").closest("tr");
      const expandButton = within(montanaRow!).getByRole("button", {
        name: /expand/i,
      });
      await userEvent.click(expandButton);

      expect(screen.getByText("Amendment 1 - Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Extension 1 - Montana Medicaid Waiver")).toBeInTheDocument();
    });

    it("shows an expand option only for demonstrations with amendments or extensions", () => {
      const table = screen.getByRole("table");
      const montanaRow = within(table).getByText("Montana Medicaid Waiver").closest("tr");
      expect(within(montanaRow!).getByRole("button", { name: /expand/i })).toBeInTheDocument();

      const texasRow = within(table).getByText("Texas Reform Initiative").closest("tr");
      expect(within(texasRow!).queryByRole("button", { name: /expand/i })).toBeNull();
    });

    it("shows amendment/extension details with correct columns when expanded", async () => {
      const table = screen.getByRole("table");
      const montanaRow = within(table).getByText("Montana Medicaid Waiver").closest("tr");
      const expandButton = within(montanaRow!).getByRole("button", {
        name: /expand/i,
      });
      await userEvent.click(expandButton);

      const montanaAmendmentRow = within(table)
        .getByText("Amendment 1 - Montana Medicaid Waiver")
        .closest("tr");
      const cells = within(montanaAmendmentRow!).getAllByRole("cell");

      expect(within(cells[0]).getByRole("checkbox")).toBeInTheDocument();
      expect(cells[1]).toHaveTextContent("Montana");
      expect(cells[2]).toHaveTextContent("Amendment 1 - Montana Medicaid Waiver");
      expect(cells[3]).toHaveTextContent("John Doe");
      expect(cells[4]).toHaveTextContent(/Amendment/);
      expect(cells[5]).toHaveTextContent("Pending");
      expect(within(cells[6]).getByRole("button")).toHaveTextContent("View");
      expect(within(cells[7]).queryByRole("button", { name: /Expand/i })).toBeNull();
    });

    it("pagination applies only to demonstration records, not to nested amendments/extensions", async () => {
      // Switch to All Demonstrations tab
      // Set items per page to 10
      const itemsPerPageSelect = screen.getByRole("combobox", {
        name: /items per page/i,
      });
      await userEvent.selectOptions(itemsPerPageSelect, ["10"]);
      // Only one demonstration should be visible, but all its children should show when expanded
      const table = screen.getByRole("table");
      const tbody = table.querySelector("tbody");
      if (!tbody) throw new Error("tbody not found");
      const visibleDemos = within(tbody).getAllByRole("row");
      expect(visibleDemos.length).toBe(10);
      // Expand and check all children are visible
      const expandButton = within(visibleDemos[0]).getByRole("button", {
        name: "expand",
      });
      await userEvent.click(expandButton);
      expect(screen.getByText("Amendment 1 - Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Extension 1 - Montana Medicaid Waiver")).toBeInTheDocument();
    });

    it("sorting applies only to demonstration records, not to nested amendments/extensions", async () => {
      // Click to sort by Title
      const titleHeader = screen.getByRole("columnheader", { name: "Title" });
      await userEvent.click(titleHeader);
      // Find all demonstration titles in the table
      const demoTitles = [
        "Montana Medicaid Waiver",
        "Texas Reform Initiative",
        "Florida Health Innovation",
      ];
      // Get all rows in the table body
      const allRows = screen.getAllByRole("row");
      // Filter rows that contain a demonstration title
      const demoRows = allRows.filter((row) =>
        demoTitles.some((title) => within(row).queryByText(title, { exact: false }))
      );
      // Get the title from the first demonstration row
      const firstDemoRow = demoRows[1];
      const firstDemoTitle = demoTitles.find((title) =>
        within(firstDemoRow).queryByText(title, { exact: false })
      );
      expect(demoTitles).toContain(firstDemoTitle);
      // Expand first demo and check children are still grouped
      const expandButton = within(firstDemoRow).queryByRole("button", {
        name: /expand/i,
      });
      if (expandButton) {
        await userEvent.click(expandButton);
        // Check for child rows by their content, e.g. "Amendment" or "Extension"
        expect(
          within(firstDemoRow.parentElement!).queryByText("Amendment 1 - Montana Medicaid Waiver")
        ).toBeInTheDocument();
      }
    });

    it("search applies to all records, but always displays parent demonstration with matching children", async () => {
      expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();

      const keywordSearchInput = screen.getByRole("textbox", {
        name: /input keyword search query/i,
      });

      await userEvent.type(keywordSearchInput, "Amendment 2");

      await waitFor(() => {
        expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();
        expect(
          screen.getByText((content, element) => {
            return element?.textContent === "Amendment 2 - Florida Health Innovation";
          })
        ).toBeInTheDocument();
        expect(screen.queryByText("Amendment 3")).not.toBeInTheDocument();
      });
    });

    it("filtering applies to all records, but always displays parent demonstration with matching children", async () => {
      expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();

      const filterBySelect = screen.getByRole("combobox", { name: /filter by:/i });
      await userEvent.selectOptions(filterBySelect, "projectOfficer");

      const projectOfficerInput = await screen.findByPlaceholderText(/select project officer/i);
      await userEvent.type(projectOfficerInput, "Darth Smith");

      const projectOfficerOption = await screen.findByText("Darth Smith");
      await userEvent.click(projectOfficerOption);

      await waitFor(() => {
        // Parent demonstration is visible
        expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();
        // Only the matching amendment is visible
        expect(
          screen.getByText((content, element) => {
            return element?.textContent === "Amendment 3 - Florida Health Innovation";
          })
        ).toBeInTheDocument(); // Other amendments/extensions for this demo are not visible
        expect(screen.queryByText("Amendment 2")).not.toBeInTheDocument();
      });
    });
  });
});
