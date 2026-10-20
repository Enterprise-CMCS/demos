import { screen, within } from "@testing-library/react";
import { UserEvent } from "@testing-library/user-event";

const FILTER_BY_COLUMN_TEST_ID = "filter-by-column";

/**
 * Opens the ColumnFilter "Filter By" dropdown and returns its listbox.
 */
export const openFilterByColumn = async (user: UserEvent) => {
  await user.click(screen.getByTestId(FILTER_BY_COLUMN_TEST_ID));
  return screen.getByRole("listbox");
};

/**
 * Selects a column in the ColumnFilter "Filter By" dropdown by its visible label.
 */
export const selectFilterByColumn = async (user: UserEvent, columnLabel: string) => {
  const listbox = await openFilterByColumn(user);
  await user.click(within(listbox).getByRole("button", { name: columnLabel }));
};

/**
 * Returns the labels listed in the ColumnFilter "Filter By" dropdown, in order.
 */
export const getFilterByColumnLabels = async (user: UserEvent) => {
  const listbox = await openFilterByColumn(user);
  return within(listbox)
    .getAllByRole("option")
    .map((option) => option.textContent);
};
