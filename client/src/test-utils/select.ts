import { screen, within } from "@testing-library/react";
import { UserEvent } from "@testing-library/user-event";

type ClickUser = Pick<UserEvent, "click">;

// Finds a select by the label of its chosen option, like getByDisplayValue does for a native <select>
export const querySelectByDisplayValue = (label: string) =>
  screen.queryAllByRole("combobox").find((select) => select.textContent === label) ?? null;

export const getSelectByDisplayValue = (label: string) => {
  const select = querySelectByDisplayValue(label);
  if (!select) {
    throw new Error(`No select found displaying "${label}"`);
  }
  return select;
};

// The shared <Select> renders a custom listbox instead of a native <select>, so tests open it
// and click an option rather than calling user.selectOptions
export const openSelect = async (user: ClickUser, select: HTMLElement) => {
  if (select.getAttribute("aria-expanded") !== "true") {
    await user.click(select);
  }
  const listboxId = select.getAttribute("aria-controls");
  const listbox = listboxId && document.getElementById(listboxId);
  if (!listbox) {
    throw new Error(`No listbox found for select "${select.id}"`);
  }
  return listbox;
};

// Matches an option by its visible label or its value, like user.selectOptions does
export const selectOption = async (
  user: ClickUser,
  select: HTMLElement,
  labelOrValue: string
) => {
  const listbox = await openSelect(user, select);
  const optionButton = within(listbox)
    .getAllByRole("button")
    .find(
      (button) =>
        button.textContent === labelOrValue ||
        button.dataset.testid === `${select.id}-option-${labelOrValue}`
    );
  if (!optionButton) {
    throw new Error(`No option "${labelOrValue}" found for select "${select.id}"`);
  }
  await user.click(optionButton);
};

export const getSelectOptionLabels = async (user: ClickUser, select: HTMLElement) => {
  const listbox = await openSelect(user, select);
  return within(listbox)
    .getAllByRole("option")
    .map((option) => option.textContent);
};
