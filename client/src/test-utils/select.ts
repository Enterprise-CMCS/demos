import { screen, within } from "@testing-library/react";
import { UserEvent } from "@testing-library/user-event";

type ClickUser = Pick<UserEvent, "click">;

export const querySelectByDisplayValue = (label: string) =>
  screen.queryAllByRole("combobox").find((select) => select.textContent === label) ?? null;

export const getSelectByDisplayValue = (label: string) => {
  const select = querySelectByDisplayValue(label);
  if (!select) {
    throw new Error(`No select found displaying "${label}"`);
  }
  return select;
};

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
