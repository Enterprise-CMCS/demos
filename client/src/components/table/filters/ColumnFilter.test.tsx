import React from "react";

import { beforeEach, describe, expect, it } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Table } from "../Table";
import { testTableData, TestType } from "../Table.test";
import { createColumnHelper } from "@tanstack/react-table";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const columnHelper = createColumnHelper<TestType>();

export const testColumns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("description", {
    header: "Description",
    enableColumnFilter: false,
  }),
  columnHelper.accessor("option.name", {
    header: "Option",
    meta: {
      filterConfig: {
        filterType: "select",
        options: [
          { label: "Option Alpha", value: "Option Alpha" },
          { label: "Option Beta", value: "Option Beta" },
          { label: "Option Gamma", value: "Option Gamma" },
          { label: "Option Delta", value: "Option Delta" },
        ],
      },
    },
  }),
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    meta: {
      filterConfig: {
        filterType: "date",
      },
    },
  }),
];

describe("ColumnFilter Component", () => {
  beforeEach(() => {
    localStorage.clear();
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Table<TestType>
          columns={testColumns}
          data={testTableData}
          columnFilter
          noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
        />
      </LocalizationProvider>
    );
  });

  describe("Initial Render", () => {
    it("renders the filter dropdown with correct label", () => {
      expect(screen.getByText(/filter by:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by:/i)).toBeInTheDocument();
    });

    it("displays all table rows initially", () => {
      // All 5 items should be visible
      expect(screen.getByText("Item One")).toBeInTheDocument();
      expect(screen.getByText("Item Two")).toBeInTheDocument();
      expect(screen.getByText("Item Three")).toBeInTheDocument();
      expect(screen.getByText("Item Four")).toBeInTheDocument();
      expect(screen.getByText("Item Five")).toBeInTheDocument();
    });

    it("does not show filter input initially", () => {
      // No filter input should be visible until a column is selected
      expect(
        screen.queryByPlaceholderText(/filter name/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText(/filter option/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText(/filter date/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Filter Selection", () => {
    it("shows filter input when a column is selected", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      // Type to filter the options and then click on the option
      await user.type(columnSelect, "Name");

      await waitFor(() => {
        // Look for the Name option in the dropdown list
        const dropdownOptions = screen.getAllByText("Name");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      // Click on the Name option in the dropdown
      const dropdownOptions = screen.getAllByText("Name");
      const dropdownOption = dropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(dropdownOption!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });
    });

    it("changes filter input type based on column selection", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      // Test text filter (Name column)
      await user.type(columnSelect, "Name");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Name");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const nameDropdownOptions = screen.getAllByText("Name");
      const nameDropdownOption = nameDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(nameDropdownOption!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      // Test select filter (Option column)
      await user.clear(columnSelect);
      await user.type(columnSelect, "Option");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Option");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const optionDropdownOptions = screen.getAllByText("Option");
      const optionDropdownOption = optionDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(optionDropdownOption!);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/filter option/i)
        ).toBeInTheDocument();
      });

      // Test date filter (Date column)
      await user.clear(columnSelect);
      await user.type(columnSelect, "Date");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Date");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const dateDropdownOptions = screen.getAllByText("Date");
      const dateDropdownOption = dateDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(dateDropdownOption!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter date/i)).toBeInTheDocument();
      });
    });

    it("clears filter value when changing columns", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      // Select name column and enter a filter
      await user.type(columnSelect, "Name");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Name");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const nameDropdownOptions = screen.getAllByText("Name");
      const nameDropdownOption = nameDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(nameDropdownOption!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "Item One");

      // Change to option column
      await user.clear(columnSelect);
      await user.type(columnSelect, "Option");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Option");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const optionDropdownOptions = screen.getAllByText("Option");
      const optionDropdownOption = optionDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(optionDropdownOption!);

      await waitFor(() => {
        const optionFilterInput = screen.getByPlaceholderText(/filter option/i);
        expect(optionFilterInput).toHaveValue("");
      });
    });
  });

  describe("Text Filtering", () => {
    it("filters rows correctly by name column", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.type(columnSelect, "Name");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Name");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const nameDropdownOptions = screen.getAllByText("Name");
      const nameDropdownOption = nameDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(nameDropdownOption!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "Item One");

      await waitFor(() => {
        // Should show only Item One
        expect(screen.getByText("Item One")).toBeInTheDocument();

        // Should not show other items
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
      });
    });

    it("is case insensitive", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.type(columnSelect, "Name");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Name");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const nameDropdownOptions = screen.getAllByText("Name");
      const nameDropdownOption = nameDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(nameDropdownOption!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "item one");

      await waitFor(() => {
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
      });
    });

    it("handles partial matches", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.type(columnSelect, "Name");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Name");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const nameDropdownOptions = screen.getAllByText("Name");
      const nameDropdownOption = nameDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(nameDropdownOption!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "Item");

      await waitFor(() => {
        // Should show all items since they all contain "Item"
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(screen.getByText("Item Two")).toBeInTheDocument();
        expect(screen.getByText("Item Three")).toBeInTheDocument();
        expect(screen.getByText("Item Four")).toBeInTheDocument();
        expect(screen.getByText("Item Five")).toBeInTheDocument();
      });
    });
  });

  describe("Select Filter Type", () => {
    it("renders AutoCompleteSelect when column has select filter type", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.type(columnSelect, "Option");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Option");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const optionDropdownOptions = screen.getAllByText("Option");
      const optionDropdownOption = optionDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(optionDropdownOption!);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/filter option/i)
        ).toBeInTheDocument();
      });
    });

    it("filters correctly using select filter", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.type(columnSelect, "Option");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Option");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const optionDropdownOptions = screen.getAllByText("Option");
      const optionDropdownOption = optionDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(optionDropdownOption!);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/filter option/i)
        ).toBeInTheDocument();
      });

      const optionFilterInput = screen.getByPlaceholderText(/filter option/i);
      await user.type(optionFilterInput, "Option Alpha");

      await waitFor(() => {
        const alphaOptions = screen.getAllByText("Option Alpha");
        const alphaDropdownOption = alphaOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(alphaDropdownOption).toBeInTheDocument();
      });

      const alphaOptions = screen.getAllByText("Option Alpha");
      const alphaDropdownOption = alphaOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(alphaDropdownOption!);

      await waitFor(() => {
        // Should show items with Option Alpha (Item One and Item Five)
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(screen.getByText("Item Five")).toBeInTheDocument();

        // Should not show items with other options
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
      });
    });
  });

  describe("Date Filter Type", () => {
    describe("Date Filter Type", () => {
      it("renders DatePicker when column has date filter type", async () => {
        const user = userEvent.setup();
        const columnSelect = screen.getByLabelText(/filter by:/i);

        await user.type(columnSelect, "Date");

        await waitFor(() => {
          const dropdownOptions = screen.getAllByText("Date");
          const dropdownOption = dropdownOptions.find(
            (el) => el.tagName === "LI" || el.closest("li")
          );
          expect(dropdownOption).toBeInTheDocument();
        });

        const dateDropdownOptions = screen.getAllByText("Date");
        const dateDropdownOption = dateDropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        await user.click(dateDropdownOption!);

        await waitFor(() => {
          expect(
            screen.getByPlaceholderText(/filter date/i)
          ).toBeInTheDocument();
          // Check for all expected date fields
          expect(screen.getByLabelText("Month")).toBeInTheDocument();
          expect(screen.getByLabelText("Day")).toBeInTheDocument();
          expect(screen.getByLabelText("Year")).toBeInTheDocument();
        });
      });

      describe("Date Filter Type", () => {
        it("filters rows by date", async () => {
          const user = userEvent.setup();
          screen.debug(document.body, 100000);

          const columnSelect = screen.getByLabelText(/filter by:/i);

          await user.type(columnSelect, "Date");

          await waitFor(() => {
            const dropdownOptions = screen.getAllByText("Date");
            const dropdownOption = dropdownOptions.find(
              (el) => el.tagName === "LI" || el.closest("li")
            );
            expect(dropdownOption).toBeInTheDocument();
          });

          const dateDropdownOptions = screen.getAllByText("Date");
          const dateDropdownOption = dateDropdownOptions.find(
            (el) => el.tagName === "LI" || el.closest("li")
          );
          await user.click(dateDropdownOption!);

          // Wait for the segmented date picker to appear
          await waitFor(() => {
            expect(screen.getByLabelText("Month")).toBeInTheDocument();
            expect(screen.getByLabelText("Day")).toBeInTheDocument();
            expect(screen.getByLabelText("Year")).toBeInTheDocument();
          });

          await user.click(screen.getByLabelText("Year"));
          await user.keyboard("2023");

          await user.click(screen.getByLabelText("Month"));
          await user.keyboard("01");

          await user.click(screen.getByLabelText("Day"));
          await user.keyboard("01");

          await waitFor(() => {
            const hiddenDateInput = screen
              .getAllByRole("textbox", { hidden: true })
              .find(
                (input) =>
                  input.getAttribute("aria-hidden") === "true" &&
                  input.getAttribute("name") === "filter-date"
              );
            expect(hiddenDateInput).toHaveValue("01/01/2023");
          });
          screen.debug(document.body, 100000);
          await waitFor(() => {
            expect(screen.getByText("Item One")).toBeInTheDocument();
            expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
            expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
            expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
            expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
          });
        });

        it("shows no results for unmatched MM/DD/YYYY date", async () => {
          const user = userEvent.setup();
          const columnSelect = screen.getByLabelText(/filter by:/i);

          await user.type(columnSelect, "Date");

          await waitFor(() => {
            const dropdownOptions = screen.getAllByText("Date");
            const dropdownOption = dropdownOptions.find(
              (el) => el.tagName === "LI" || el.closest("li")
            );
            expect(dropdownOption).toBeInTheDocument();
          });

          const dateDropdownOptions = screen.getAllByText("Date");
          const dateDropdownOption = dateDropdownOptions.find(
            (el) => el.tagName === "LI" || el.closest("li")
          );
          await user.click(dateDropdownOption!);

          // Wait for the segmented date picker to appear
          await waitFor(() => {
            expect(screen.getByLabelText("Month")).toBeInTheDocument();
            expect(screen.getByLabelText("Day")).toBeInTheDocument();
            expect(screen.getByLabelText("Year")).toBeInTheDocument();
          });

          await user.click(screen.getByLabelText("Year"));
          await user.keyboard("2000");

          await user.click(screen.getByLabelText("Month"));
          await user.keyboard("01");

          await user.click(screen.getByLabelText("Day"));
          await user.keyboard("01");

          await waitFor(() => {
            expect(
              screen.getByText(
                "No results were returned. Adjust your search and filter criteria."
              )
            ).toBeInTheDocument();
          });
        });
      });
    });
  });

  describe("No Results State", () => {
    it("shows no results message when filter yields no matches", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.type(columnSelect, "Name");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Name");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const nameDropdownOptions = screen.getAllByText("Name");
      const nameDropdownOption = nameDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(nameDropdownOption!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "NonexistentItem");

      await waitFor(() => {
        expect(
          screen.getByText(
            "No results were returned. Adjust your search and filter criteria."
          )
        ).toBeInTheDocument();

        // No table rows should be visible
        expect(screen.queryByText("Item One")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
      });
    });

    it("returns to showing results when valid filter is applied after no results", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.type(columnSelect, "Name");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("Name");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const nameDropdownOptions = screen.getAllByText("Name");
      const nameDropdownOption = nameDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(nameDropdownOption!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);

      // First filter with no results
      await user.type(nameFilterInput, "NonexistentItem");

      await waitFor(() => {
        expect(
          screen.getByText(
            "No results were returned. Adjust your search and filter criteria."
          )
        ).toBeInTheDocument();
      });

      // Clear and filter for something that exists
      await user.clear(nameFilterInput);
      await user.type(nameFilterInput, "Item One");

      await waitFor(() => {
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(
          screen.queryByText(
            "No results were returned. Adjust your search and filter criteria."
          )
        ).not.toBeInTheDocument();
      });
    });
  });
});
